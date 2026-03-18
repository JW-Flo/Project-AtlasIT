/**
 * Evaluates automation rules against incoming events within the ai-orchestrator.
 *
 * Automation rules and execution records live in ATLAS_SHARED_DB (the same D1
 * database as the console-app). When evaluateAutomationRules is called it MUST
 * receive the shared DB so that:
 *   1. Rules are loaded from the same place the console-app creates them.
 *   2. Execution records written here are immediately visible in the console-app's
 *      /api/automation/executions endpoint.
 *
 * The `db` parameter is therefore expected to be ATLAS_SHARED_DB, not ATLAS_CORE_DB.
 */

import {
  matchRules,
  sortActions,
  buildExecutionSummary,
  interpolateTemplate,
} from "@atlasit/shared/automation/engine";
import type {
  AutomationRule,
  AutomationEvent,
  ActionResult,
  ActionType,
  RuleAction,
  TriggerType,
  CanonicalUserProfile,
} from "@atlasit/shared/automation/types";
import { ACTION_COMPLIANCE_MAP } from "@atlasit/shared/automation/compliance-mapping";
import { enrichUserProfile } from "./profile-enricher";

/** Map of orchestrator event types to automation trigger types */
const EVENT_TYPE_MAP: Record<string, TriggerType> = {
  "user.created": "user_created",
  "user.deactivated": "user_deactivated",
  "user.joined_group": "user_joined_group",
  "user.left_group": "user_left_group",
  "app.connected": "app_connected",
  "app.disconnected": "app_disconnected",
  "app.health_changed": "app_health_changed",
  "compliance.score_changed": "compliance_score_changed",
};

export interface ActionContext {
  workflow?: DurableObjectNamespace; // for run_workflow
  selfUrl?: string; // for send_notification (self-POST to event bus)
  adapterUrls?: Record<string, string>; // appId → adapter worker base URL
  sharedDb?: D1Database; // for create_incident, update_compliance_status
}

interface EvaluateResult {
  matched: number;
  executions: Array<{
    ruleId: string;
    ruleName: string;
    status: "success" | "partial" | "failed" | "running";
    actionsRun: number;
  }>;
}

/**
 * Load enabled automation rules for a tenant from D1.
 */
async function loadTenantRules(
  db: D1Database,
  tenantId: string,
): Promise<AutomationRule[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM automation_rules WHERE tenant_id = ? AND enabled = 1",
    )
    .bind(tenantId)
    .all();

  return (results || []).map(rowToRule);
}

/**
 * Evaluate an incoming event against a tenant's automation rules.
 * Returns matched rule count and execution details.
 *
 * When an `automationDO` namespace is provided, the evaluator checks
 * cooldowns and dedup before executing, and records execution afterward.
 */
export async function evaluateAutomationRules(
  db: D1Database,
  tenantId: string,
  eventType: string,
  source: string,
  payload: unknown,
  automationDO?: DurableObjectNamespace,
  actionContext?: ActionContext,
): Promise<EvaluateResult> {
  const triggerType = EVENT_TYPE_MAP[eventType];
  if (!triggerType) {
    return { matched: 0, executions: [] };
  }

  const rules = await loadTenantRules(db, tenantId);
  if (rules.length === 0) {
    return { matched: 0, executions: [] };
  }

  const event: AutomationEvent = {
    type: triggerType,
    tenantId,
    payload: (payload as Record<string, unknown>) ?? {},
    timestamp: new Date().toISOString(),
    source,
  };

  const matched = matchRules(rules, event);
  if (matched.length === 0) {
    return { matched: 0, executions: [] };
  }

  // Enrich user profile once for this event if user context is present
  const userEmail = (payload as Record<string, unknown>)?.email as
    | string
    | undefined;
  const userId = (payload as Record<string, unknown>)?.userId as
    | string
    | undefined;
  let userProfile: CanonicalUserProfile | null = null;
  if (actionContext?.sharedDb && (userEmail || userId)) {
    userProfile = await enrichUserProfile(actionContext.sharedDb, tenantId, {
      email: userEmail,
      userId,
    }).catch(() => null);
  }

  const executions: EvaluateResult["executions"] = [];

  for (const rule of matched) {
    // Check cooldown/dedup via Durable Object if available
    const dedupKey = `${tenantId}:${rule.id}:${eventType}:${JSON.stringify(payload)}`;
    if (automationDO) {
      const doId = automationDO.idFromName(tenantId);
      const stub = automationDO.get(doId);
      const checkRes = await stub.fetch(
        new Request("http://automation/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ruleId: rule.id, dedupKey }),
        }),
      );
      const check = (await checkRes.json()) as {
        allowed: boolean;
        reason?: string;
      };
      if (!check.allowed) {
        continue; // Skip this rule — cooldown/dedup/rate-limit
      }
    }

    const startTime = Date.now();
    const actions = sortActions(rule.actions);
    const results: ActionResult[] = [];
    const executionId = crypto.randomUUID().replace(/-/g, "");

    for (const action of actions) {
      try {
        const interpolatedConfig: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(action.config)) {
          interpolatedConfig[k] =
            typeof v === "string"
              ? interpolateTemplate(v, {
                  ...event.payload,
                  ...(userProfile ?? {}),
                })
              : v;
        }

        const result = await executeAction(
          action,
          event,
          interpolatedConfig,
          actionContext ?? {},
          userProfile,
        );
        results.push(result);

        // Emit compliance evidence for each successful action
        if (result.status === "success") {
          await emitComplianceEvidence(
            db,
            tenantId,
            action.type,
            executionId,
          ).catch(() => {
            // Non-critical — evidence emission must not block execution
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ actionType: action.type, status: "failed", message });
      }
    }

    const durationMs = Date.now() - startTime;
    const summary = buildExecutionSummary(rule, results, durationMs);

    // Record execution in D1
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO automation_executions
          (id, tenant_id, rule_id, trigger_event, status, actions_run, actions_failed, results, duration_ms, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        executionId,
        tenantId,
        rule.id,
        JSON.stringify(event.payload),
        summary.status,
        summary.actionsRun,
        summary.actionsFailed,
        JSON.stringify(results),
        summary.durationMs,
        now,
        now,
      )
      .run();

    // Update rule stats
    const statusUpdate =
      summary.status === "failed" ? ", error_count = error_count + 1" : "";

    await db
      .prepare(
        `UPDATE automation_rules
         SET last_run_at = ?, last_status = ?, run_count = run_count + 1${statusUpdate}, updated_at = datetime('now')
         WHERE id = ? AND tenant_id = ?`,
      )
      .bind(now, summary.status, rule.id, tenantId)
      .run();

    // Record execution in Durable Object for cooldown/dedup tracking
    if (automationDO) {
      const doId = automationDO.idFromName(tenantId);
      const stub = automationDO.get(doId);
      await stub
        .fetch(
          new Request("http://automation/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ruleId: rule.id, dedupKey }),
          }),
        )
        .catch(() => {
          // Non-critical — log but don't fail the execution
        });
    }

    executions.push({
      ruleId: rule.id,
      ruleName: rule.name,
      status: summary.status,
      actionsRun: summary.actionsRun,
    });
  }

  return { matched: matched.length, executions };
}

// ── Action executor ───────────────────────────────────────────────────────────

async function executeAction(
  action: RuleAction,
  event: AutomationEvent,
  config: Record<string, unknown>,
  ctx: ActionContext,
  profile: CanonicalUserProfile | null,
): Promise<ActionResult> {
  switch (action.type) {
    // ── Workflow execution ──────────────────────────────────────────────────
    case "run_workflow": {
      if (!ctx.workflow) return skip(action.type, "no WORKFLOW binding");
      const { workflowType = "joiner" } = config as { workflowType: string };
      const runId = crypto.randomUUID();
      const doId = ctx.workflow.idFromName(runId);
      const stub = ctx.workflow.get(doId);
      await stub.fetch(
        new Request("http://workflow/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            definition: {
              id: `${workflowType}-${runId}`,
              name: workflowType,
              steps: buildWorkflowSteps(workflowType, ctx.adapterUrls ?? {}),
              globalTimeoutMs: 5 * 60 * 1000,
            },
            tenantId: event.tenantId,
            correlationId: runId,
            context: {
              workflowType,
              triggerEvent: event,
              ...(profile
                ? {
                    userId: profile.id,
                    email: profile.email,
                    displayName: profile.displayName,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    department: profile.department,
                    title: profile.title,
                    manager: profile.manager,
                    phone: profile.phone,
                    groups: profile.groups,
                    appAccess: profile.appAccess,
                    rawAttributes: profile.rawAttributes,
                  }
                : {}),
            },
          }),
        }),
      );
      return ok(action.type, `${workflowType} workflow started`, { runId });
    }

    // ── Notifications ───────────────────────────────────────────────────────
    case "send_notification": {
      if (!ctx.selfUrl) return skip(action.type, "no SELF_URL configured");
      const { channel = "slack", template, notifyUser, notifyAdmin } = config;
      await fetch(`${ctx.selfUrl}/api/v1/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: event.tenantId,
          type: `notification.${template ?? "generic"}`,
          source: "automation",
          payload: {
            channel,
            notifyUser,
            notifyAdmin,
            user: profile
              ? {
                  email: profile.email,
                  displayName: profile.displayName,
                  firstName: profile.firstName,
                  department: profile.department,
                  title: profile.title,
                  manager: profile.manager,
                }
              : event.payload,
            context: event.payload,
          },
        }),
      });
      return ok(action.type, `Notification dispatched via ${channel}`);
    }

    // ── Incident creation ───────────────────────────────────────────────────
    case "create_incident": {
      const db = ctx.sharedDb;
      if (!db) return skip(action.type, "no sharedDb binding");
      const {
        severity = "medium",
        title = "Automation incident",
        autoResolve = false,
      } = config;
      const id = crypto.randomUUID().replace(/-/g, "");
      const description = profile
        ? `Triggered for ${profile.displayName} (${profile.email}) — ${profile.department ?? ""} ${profile.title ?? ""}`
        : JSON.stringify(event.payload).slice(0, 500);
      await db
        .prepare(
          "INSERT INTO incidents (id, tenant_id, title, severity, source, source_id, description, auto_resolve) VALUES (?,?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          event.tenantId,
          String(title),
          String(severity),
          "automation",
          null,
          description,
          autoResolve ? 1 : 0,
        )
        .run();
      return ok(action.type, "Incident created", { incidentId: id });
    }

    // ── App provisioning ────────────────────────────────────────────────────
    case "provision_app_access": {
      const { appId, role } = config as { appId?: string; role?: string };
      const adapterUrl = resolveAdapterUrl(appId, ctx);
      if (!adapterUrl)
        return skip(
          action.type,
          `no adapter URL for app "${appId ?? "unset"}"`,
        );

      // Okta uses SCIM 2.0
      if (appId === "okta") {
        const res = await fetch(`${adapterUrl}/scim/v2/Users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/scim+json",
            "X-Tenant-ID": event.tenantId,
          },
          body: JSON.stringify(buildScimUser(profile, config)),
        });
        return res.ok
          ? ok(action.type, "User provisioned via SCIM")
          : fail(action.type, `SCIM provision failed: HTTP ${res.status}`);
      }

      // All other adapters: standard contract POST /api/provision
      const res = await fetch(`${adapterUrl}/api/provision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": event.tenantId,
        },
        body: JSON.stringify({
          tenantId: event.tenantId,
          userProfile: profile,
          config,
          role,
        }),
      });
      return res.ok
        ? ok(action.type, `User provisioned in ${appId}`)
        : fail(action.type, `Provision failed: HTTP ${res.status}`);
    }

    case "revoke_app_access": {
      const { appId } = config as { appId?: string };
      const adapterUrl = resolveAdapterUrl(appId, ctx);
      if (!adapterUrl)
        return skip(
          action.type,
          `no adapter URL for app "${appId ?? "unset"}"`,
        );

      if (appId === "okta" && profile?.externalId) {
        const res = await fetch(
          `${adapterUrl}/scim/v2/Users/${profile.externalId}`,
          {
            method: "DELETE",
            headers: { "X-Tenant-ID": event.tenantId },
          },
        );
        return res.ok
          ? ok(action.type, "User deprovisioned via SCIM")
          : fail(action.type, `SCIM deprovision failed: HTTP ${res.status}`);
      }

      const res = await fetch(`${adapterUrl}/api/deprovision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": event.tenantId,
        },
        body: JSON.stringify({
          tenantId: event.tenantId,
          userProfile: profile,
          config,
        }),
      });
      return res.ok
        ? ok(action.type, `User deprovisioned from ${appId}`)
        : fail(action.type, `Deprovision failed: HTTP ${res.status}`);
    }

    // ── Directory sync ──────────────────────────────────────────────────────
    case "sync_directory": {
      const { appId } = config as { appId?: string };
      const targets = appId
        ? ([resolveAdapterUrl(appId, ctx)].filter(Boolean) as string[])
        : Object.values(ctx.adapterUrls ?? {});
      await Promise.allSettled(
        targets.map((url) =>
          fetch(`${url}/api/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-ID": event.tenantId,
            },
            body: JSON.stringify({ tenantId: event.tenantId }),
          }),
        ),
      );
      return ok(
        action.type,
        `Directory sync dispatched to ${targets.length} adapter(s)`,
      );
    }

    // ── Role assignment ─────────────────────────────────────────────────────
    case "assign_role":
    case "remove_role": {
      const { appId, roleId } = config as { appId: string; roleId: string };
      const adapterUrl = resolveAdapterUrl(appId, ctx);
      if (!adapterUrl) return skip(action.type, `no adapter URL for ${appId}`);
      const method = action.type === "assign_role" ? "POST" : "DELETE";
      const userId = profile?.externalId ?? (event.payload.userId as string);
      const res = await fetch(`${adapterUrl}/api/roles/${roleId}/members`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": event.tenantId,
        },
        body: JSON.stringify({
          tenantId: event.tenantId,
          userId,
          userProfile: profile,
        }),
      });
      return res.ok
        ? ok(
            action.type,
            `Role ${roleId} ${action.type === "assign_role" ? "assigned" : "removed"}`,
          )
        : fail(action.type, `Role update failed: HTTP ${res.status}`);
    }

    // ── Compliance status ───────────────────────────────────────────────────
    case "update_compliance_status": {
      const db = ctx.sharedDb;
      if (!db) return skip(action.type, "no sharedDb binding");
      const { controlId, status: newStatus } = config as {
        controlId: string;
        status: string;
      };
      await db
        .prepare(
          'UPDATE compliance_controls SET status = ?, updated_at = datetime("now") WHERE id = ? AND tenant_id = ?',
        )
        .bind(newStatus, controlId, event.tenantId)
        .run();
      return ok(action.type, `Control ${controlId} → ${newStatus}`);
    }

    default:
      return fail(action.type as string, "unknown action type");
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(
  actionType: string,
  message: string,
  details?: Record<string, unknown>,
): ActionResult {
  return {
    actionType: actionType as ActionType,
    status: "success",
    message,
    details,
  };
}
function fail(actionType: string, message: string): ActionResult {
  return { actionType: actionType as ActionType, status: "failed", message };
}
/** Graceful fallback when a required binding/URL is not configured. */
function skip(actionType: string, message: string): ActionResult {
  return { actionType: actionType as ActionType, status: "skipped", message };
}
function resolveAdapterUrl(
  appId: string | undefined,
  ctx: ActionContext,
): string | undefined {
  if (!appId) return undefined;
  // Explicit override wins (custom domains, per-env overrides)
  const override = (ctx.adapterUrls ?? {})[appId];
  if (override) return override;
  // Fall back to canonical worker URL: atlasit-adapter-{appId}.atlasit.workers.dev
  return `https://atlasit-adapter-${appId}.atlasit.workers.dev`;
}

/** Map CanonicalUserProfile → SCIM 2.0 User resource for Okta */
function buildScimUser(
  profile: CanonicalUserProfile | null,
  config: Record<string, unknown>,
): Record<string, unknown> {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    userName: profile?.email ?? config.email,
    name: {
      givenName: profile?.firstName ?? "",
      familyName: profile?.lastName ?? "",
      formatted: profile?.displayName ?? "",
    },
    displayName: profile?.displayName,
    emails: [
      { value: profile?.email ?? config.email, type: "work", primary: true },
    ],
    active: true,
    title: profile?.title,
    department: profile?.department,
    externalId: profile?.externalId,
    "urn:ietf:params:scim:schemas:extension:atlasit:2.0:User": {
      rawAttributes: profile?.rawAttributes ?? {},
      groups: profile?.groups ?? [],
      appAccess: profile?.appAccess ?? [],
    },
  };
}

/** Build canonical joiner/mover/leaver step arrays for WorkflowDO */
function buildWorkflowSteps(
  workflowType: string,
  adapterUrls: Record<string, string>,
): Array<{
  id: string;
  name: string;
  handler: string;
  timeoutMs: number;
  compensate?: string;
}> {
  const connectedApps = Object.keys(adapterUrls);
  const provisionSteps = connectedApps.map((appId) => ({
    id: `provision_${appId}`,
    name: `Provision ${appId}`,
    handler: `${appId}.provision`,
    timeoutMs: 30_000,
    compensate: `${appId}.deprovision`,
  }));
  const revokeSteps = connectedApps.map((appId) => ({
    id: `revoke_${appId}`,
    name: `Revoke ${appId}`,
    handler: `${appId}.deprovision`,
    timeoutMs: 30_000,
  }));

  if (workflowType === "joiner")
    return [
      {
        id: "resolve_access",
        name: "Resolve access bundle",
        handler: "atlas.resolve_access_bundle",
        timeoutMs: 10_000,
      },
      ...provisionSteps,
      {
        id: "emit_evidence",
        name: "Emit joiner evidence",
        handler: "atlas.emit_evidence",
        timeoutMs: 10_000,
      },
    ];
  if (workflowType === "leaver")
    return [
      ...revokeSteps,
      {
        id: "emit_evidence",
        name: "Emit leaver evidence",
        handler: "atlas.emit_evidence",
        timeoutMs: 10_000,
      },
    ];
  // mover: revoke old + provision new (simplified)
  return [
    ...revokeSteps.map((s) => ({ ...s, id: `old_${s.id}` })),
    ...provisionSteps.map((s) => ({ ...s, id: `new_${s.id}` })),
  ];
}

/**
 * Insert one compliance_evidence row per mapped control for a successful action.
 * Errors are swallowed by the caller — evidence emission is non-critical.
 */
async function emitComplianceEvidence(
  db: D1Database,
  tenantId: string,
  actionType: string,
  executionId: string,
): Promise<void> {
  const controls = ACTION_COMPLIANCE_MAP[actionType];
  if (!controls || controls.length === 0) return;

  const now = new Date().toISOString();
  for (const control of controls) {
    const id = crypto.randomUUID().replace(/-/g, "");
    await db
      .prepare(
        `INSERT OR IGNORE INTO compliance_evidence
          (id, tenant_id, framework, control_id, evidence_type, action_type, execution_id, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'automation', ?)`,
      )
      .bind(
        id,
        tenantId,
        control.framework,
        control.controlId,
        control.evidenceType,
        actionType,
        executionId,
        now,
      )
      .run();
  }
}

// Row → domain mapper (mirrors console-app/src/lib/server/automation.ts)
function rowToRule(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    enabled: !!row.enabled,
    triggerType: row.trigger_type as AutomationRule["triggerType"],
    triggerConfig: safeJsonParse(row.trigger_config as string, {}),
    conditions: safeJsonParse(row.conditions as string, []),
    actions: safeJsonParse(row.actions as string, []),
    lastRunAt: (row.last_run_at as string) ?? undefined,
    lastStatus: (row.last_status as AutomationRule["lastStatus"]) ?? undefined,
    runCount: (row.run_count as number) ?? 0,
    errorCount: (row.error_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: (row.created_by as string) ?? undefined,
  };
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
