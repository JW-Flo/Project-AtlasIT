/**
 * Action handler registry for the automation engine.
 * Each action type maps to a handler that performs real work:
 * - DB-only actions (assign_role, remove_role) execute directly against D1
 * - Event-driven actions emit into the `events` table for downstream consumption
 */

import type { ActionResult } from "@atlasit/shared/automation/types";
import {
  computeSlaBreachAt,
  DEFAULT_SLA_SECONDS,
  type SlaConfig,
} from "@atlasit/shared/incidents/lifecycle";

export interface ActionContext {
  db: D1Database;
  tenantId: string;
  payload: Record<string, unknown>;
  /** Orchestrator URL for forwarding events that need real-time processing */
  orchestratorUrl?: string;
  /** H-12 FIX: Service API key for inter-service auth */
  serviceApiKey?: string;
}

type ActionHandler = (config: Record<string, unknown>, ctx: ActionContext) => Promise<ActionResult>;

// ---------------------------------------------------------------------------
// Event helper — insert into the events table as event bus
// ---------------------------------------------------------------------------

async function emitEvent(
  db: D1Database,
  tenantId: string,
  type: string,
  source: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const id = crypto.randomUUID().replace(/-/g, "");
  await db
    .prepare(
      `INSERT INTO events (id, tenant_id, type, source, payload, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`,
    )
    .bind(id, tenantId, type, source, JSON.stringify(payload))
    .run();
  return id;
}

/**
 * Forward an event to the orchestrator for real-time processing.
 * Events like provisioning.requested need the orchestrator to dispatch
 * to adapters — D1 writes alone don't trigger the orchestrator's HTTP handler.
 */
async function forwardToOrchestrator(
  orchestratorUrl: string,
  tenantId: string,
  type: string,
  payload: Record<string, unknown>,
  apiKey?: string,
): Promise<void> {
  try {
    const res = await fetch(`${orchestratorUrl}/api/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify({ type, tenantId, payload, source: "console-app" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(
        `[automation-actions] Orchestrator forwarding failed: ${res.status} for ${type}`,
      );
    }
  } catch (err) {
    console.warn(
      `[automation-actions] Orchestrator unreachable for ${type}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Handler implementations
// ---------------------------------------------------------------------------

const handleSendNotification: ActionHandler = async (config, ctx) => {
  // Dispatch through the notification service for in-app + email delivery
  try {
    const { notify } = await import("$lib/server/notifications");
    await notify(ctx.db, null, {
      tenantId: ctx.tenantId,
      type: "automation_triggered",
      title: (config.title as string) || "Automation notification",
      body: (config.message as string) || (config.body as string) || "",
      severity: (config.severity as any) || "info",
      sourceType: "automation_rule",
      sourceId: (config.ruleId as string) || undefined,
      sourceLabel: (config.ruleName as string) || "Automation rule",
      actionUrl: "/console/automation",
      metadata: { triggerPayload: ctx.payload },
    });
  } catch {
    // Fall back to event emission if notification service fails
  }

  const eventId = await emitEvent(ctx.db, ctx.tenantId, "notification", "automation-engine", {
    ...config,
    triggerPayload: ctx.payload,
  });
  return {
    actionType: "send_notification",
    status: "success",
    message: `Notification dispatched`,
    details: { eventId, ...config },
  };
};

const handleCreateIncident: ActionHandler = async (config, ctx) => {
  const id = crypto.randomUUID().replace(/-/g, "");
  const title =
    (config.title as string) ||
    (config.message as string) ||
    `Auto-incident: ${ctx.payload?.eventType || "unknown event"}`;
  const severity = (config.severity as string) || "medium";
  const description =
    (config.description as string) ||
    `Created by automation rule. Trigger: ${JSON.stringify(ctx.payload).slice(0, 500)}`;

  // Compute SLA breach deadline
  const now = new Date().toISOString();
  let slaConfig: SlaConfig = DEFAULT_SLA_SECONDS;
  try {
    const row = await ctx.db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'",
      )
      .bind(ctx.tenantId)
      .first<{ value: string }>();
    if (row?.value) slaConfig = JSON.parse(row.value);
  } catch {
    /* use defaults */
  }
  const slaBreachAt = computeSlaBreachAt(now, severity, slaConfig);

  try {
    await ctx.db
      .prepare(
        `INSERT INTO incidents (id, tenant_id, title, severity, status, source, source_id, description, created_at, sla_breach_at)
         VALUES (?, ?, ?, ?, 'open', 'automation', ?, ?, ?, ?)`,
      )
      .bind(
        id,
        ctx.tenantId,
        title,
        severity,
        (config.ruleId as string) || null,
        description,
        now,
        slaBreachAt,
      )
      .run();
  } catch (e: any) {
    return {
      actionType: "create_incident",
      status: "failed",
      message: `Failed to create incident: ${e?.message || "DB error"}`,
    };
  }

  // Write initial timeline entry
  try {
    const timelineId = crypto.randomUUID().replace(/-/g, "");
    await ctx.db
      .prepare(
        `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
         VALUES (?, ?, ?, 'auto_action', 'system', 'Incident auto-created by automation rule')`,
      )
      .bind(timelineId, id, ctx.tenantId)
      .run();
  } catch {
    // Non-blocking
  }

  // Dispatch notification for auto-created incident
  try {
    const { notify } = await import("$lib/server/notifications");
    await notify(ctx.db, null, {
      tenantId: ctx.tenantId,
      type: "incident_created",
      title: `Auto-incident: ${title}`,
      body: description,
      severity: severity as any,
      sourceType: "incident",
      sourceId: id,
      sourceLabel: title,
      actionUrl: `/console/incidents`,
      metadata: { automated: true, ruleId: config.ruleId },
    });
  } catch {
    // Non-blocking
  }

  // Also emit event for downstream consumers (Slack notifications, etc.)
  const eventId = await emitEvent(ctx.db, ctx.tenantId, "incident.created", "automation-engine", {
    incidentId: id,
    title,
    severity,
    triggerPayload: ctx.payload,
  });

  return {
    actionType: "create_incident",
    status: "success",
    message: `Incident created`,
    details: { incidentId: id, eventId, title, severity },
  };
};

const handleAssignRole: ActionHandler = async (config, ctx) => {
  const email = (config.email as string) || (ctx.payload.email as string);
  const role = (config.role as string) || "viewer";

  if (!email) {
    return {
      actionType: "assign_role",
      status: "failed",
      message: "No email provided for role assignment",
    };
  }

  // Check if user already has a roles row
  const existing = await ctx.db
    .prepare("SELECT id, roles FROM console_user_roles WHERE email = ? AND tenant_id = ?")
    .bind(email, ctx.tenantId)
    .first();

  if (existing) {
    const currentRoles: string[] = JSON.parse((existing.roles as string) || '["viewer"]');
    if (currentRoles.includes(role)) {
      return {
        actionType: "assign_role",
        status: "success",
        message: `Role "${role}" already assigned to ${email}`,
        details: { email, role, action: "no-op" },
      };
    }
    const updatedRoles = [...currentRoles, role];
    await ctx.db
      .prepare("UPDATE console_user_roles SET roles = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(updatedRoles), existing.id)
      .run();
  } else {
    const id = crypto.randomUUID().replace(/-/g, "");
    await ctx.db
      .prepare("INSERT INTO console_user_roles (id, email, tenant_id, roles) VALUES (?, ?, ?, ?)")
      .bind(id, email, ctx.tenantId, JSON.stringify([role]))
      .run();
  }

  return {
    actionType: "assign_role",
    status: "success",
    message: `Role "${role}" assigned to ${email}`,
    details: { email, role },
  };
};

const handleRemoveRole: ActionHandler = async (config, ctx) => {
  const email = (config.email as string) || (ctx.payload.email as string);
  const role = (config.role as string) || "viewer";

  if (!email) {
    return {
      actionType: "remove_role",
      status: "failed",
      message: "No email provided for role removal",
    };
  }

  const existing = await ctx.db
    .prepare("SELECT id, roles FROM console_user_roles WHERE email = ? AND tenant_id = ?")
    .bind(email, ctx.tenantId)
    .first();

  if (!existing) {
    return {
      actionType: "remove_role",
      status: "success",
      message: `No roles found for ${email}`,
      details: { email, role, action: "no-op" },
    };
  }

  const currentRoles: string[] = JSON.parse((existing.roles as string) || "[]");
  const updatedRoles = currentRoles.filter((r) => r !== role);

  if (updatedRoles.length === currentRoles.length) {
    return {
      actionType: "remove_role",
      status: "success",
      message: `Role "${role}" not present for ${email}`,
      details: { email, role, action: "no-op" },
    };
  }

  if (updatedRoles.length === 0) {
    await ctx.db.prepare("DELETE FROM console_user_roles WHERE id = ?").bind(existing.id).run();
  } else {
    await ctx.db
      .prepare("UPDATE console_user_roles SET roles = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(updatedRoles), existing.id)
      .run();
  }

  return {
    actionType: "remove_role",
    status: "success",
    message: `Role "${role}" removed from ${email}`,
    details: { email, role },
  };
};

const handleUpdateComplianceStatus: ActionHandler = async (config, ctx) => {
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "compliance.status_changed",
    "automation-engine",
    { ...config, triggerPayload: ctx.payload },
  );
  return {
    actionType: "update_compliance_status",
    status: "success",
    message: `Compliance status change event emitted`,
    details: { eventId, ...config },
  };
};

const handleProvisionAppAccess: ActionHandler = async (config, ctx) => {
  const appId = config.appId as string;
  if (!appId) {
    return {
      actionType: "provision_app_access",
      status: "failed",
      message: "No appId specified for provisioning",
    };
  }

  // Verify the app is connected
  const credential = await ctx.db
    .prepare("SELECT id FROM app_credentials WHERE tenant_id = ? AND app_id = ?")
    .bind(ctx.tenantId, appId)
    .first();

  if (!credential) {
    return {
      actionType: "provision_app_access",
      status: "skipped",
      message: `App "${appId}" is not connected — skipping provisioning`,
      details: { appId },
    };
  }

  const provisionPayload = { action: "provision", appId, ...config, triggerPayload: ctx.payload };
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "provisioning.requested",
    "automation-engine",
    provisionPayload,
  );

  // Forward to orchestrator for real-time adapter dispatch
  if (ctx.orchestratorUrl) {
    forwardToOrchestrator(
      ctx.orchestratorUrl,
      ctx.tenantId,
      "provisioning.requested",
      provisionPayload,
      ctx.serviceApiKey,
    );
  }

  return {
    actionType: "provision_app_access",
    status: "success",
    message: `Provisioning event emitted for ${appId}`,
    details: { eventId, appId },
  };
};

const handleRevokeAppAccess: ActionHandler = async (config, ctx) => {
  const appId = config.appId as string;
  if (!appId) {
    return {
      actionType: "revoke_app_access",
      status: "failed",
      message: "No appId specified for revocation",
    };
  }

  const credential = await ctx.db
    .prepare("SELECT id FROM app_credentials WHERE tenant_id = ? AND app_id = ?")
    .bind(ctx.tenantId, appId)
    .first();

  if (!credential) {
    return {
      actionType: "revoke_app_access",
      status: "skipped",
      message: `App "${appId}" is not connected — skipping revocation`,
      details: { appId },
    };
  }

  const revokePayload = { action: "revoke", appId, ...config, triggerPayload: ctx.payload };
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "provisioning.requested",
    "automation-engine",
    revokePayload,
  );

  // Forward to orchestrator for real-time adapter dispatch
  if (ctx.orchestratorUrl) {
    forwardToOrchestrator(
      ctx.orchestratorUrl,
      ctx.tenantId,
      "provisioning.requested",
      revokePayload,
      ctx.serviceApiKey,
    );
  }

  return {
    actionType: "revoke_app_access",
    status: "success",
    message: `Revocation event emitted for ${appId}`,
    details: { eventId, appId },
  };
};

const handleRunWorkflow: ActionHandler = async (config, ctx) => {
  const eventId = await emitEvent(ctx.db, ctx.tenantId, "workflow.requested", "automation-engine", {
    ...config,
    triggerPayload: ctx.payload,
  });
  return {
    actionType: "run_workflow",
    status: "success",
    message: `Workflow request event emitted`,
    details: { eventId, ...config },
  };
};

const handleSyncDirectory: ActionHandler = async (config, ctx) => {
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "directory.sync_requested",
    "automation-engine",
    { ...config, triggerPayload: ctx.payload },
  );
  return {
    actionType: "sync_directory",
    status: "success",
    message: `Directory sync request event emitted`,
    details: { eventId, ...config },
  };
};

// ---------------------------------------------------------------------------
// Registry + dispatcher
// ---------------------------------------------------------------------------

const handlers: Record<string, ActionHandler> = {
  send_notification: handleSendNotification,
  create_incident: handleCreateIncident,
  assign_role: handleAssignRole,
  remove_role: handleRemoveRole,
  update_compliance_status: handleUpdateComplianceStatus,
  provision_app_access: handleProvisionAppAccess,
  revoke_app_access: handleRevokeAppAccess,
  run_workflow: handleRunWorkflow,
  sync_directory: handleSyncDirectory,
};

export async function executeAction(
  actionType: string,
  config: Record<string, unknown>,
  ctx: ActionContext,
): Promise<ActionResult> {
  const handler = handlers[actionType];
  if (!handler) {
    return {
      actionType,
      status: "failed",
      message: `Unknown action type: ${actionType}`,
    };
  }

  let result: ActionResult;
  try {
    result = await handler(config, ctx);
  } catch (err: any) {
    result = {
      actionType,
      status: "failed",
      message: err?.message || "Action handler threw an unexpected error",
    };
  }

  // Record every action outcome as compliance evidence
  recordActionEvidence(ctx.db, ctx.tenantId, actionType, result, config);

  return result;
}

// ---------------------------------------------------------------------------
// Evidence recording for all automation actions
// ---------------------------------------------------------------------------

/** Map action types to relevant compliance control references */
const ACTION_CONTROL_REFS: Record<string, string[]> = {
  provision_app_access: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
  revoke_app_access: ["SOC2-CC6.3", "ISO-27001-A.9.2.6", "HIPAA-164.312(a)(1)"],
  assign_role: ["SOC2-CC6.1", "ISO-27001-A.9.2.2"],
  remove_role: ["SOC2-CC6.3", "ISO-27001-A.9.2.6"],
  create_incident: ["SOC2-CC7.3", "ISO-27001-A.16.1.2", "NIST-CSF-RS.RP-1"],
  send_notification: ["SOC2-CC2.2"],
  update_compliance_status: ["SOC2-CC4.1", "ISO-27001-A.18.2.1"],
  run_workflow: ["SOC2-CC8.1", "ISO-27001-A.12.1.2"],
  sync_directory: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"],
};

function recordActionEvidence(
  db: D1Database,
  tenantId: string,
  actionType: string,
  result: ActionResult,
  config: Record<string, unknown>,
): void {
  const refs = ACTION_CONTROL_REFS[actionType];
  if (!refs || refs.length === 0) return;

  const id = `action-${tenantId}-${actionType}-${Date.now()}`;
  const evidenceStatus = result.status === "success" ? "pass" : "fail";
  const metadata = JSON.stringify({
    status: evidenceStatus,
    actionType,
    outcome: result.status,
    message: result.message,
    config: { appId: config.appId, role: config.role },
    recordedAt: new Date().toISOString(),
  });

  // Parse the first control ref for the primary evidence row
  const primaryRef = refs[0];
  const framework = primaryRef.startsWith("ISO-")
    ? "ISO27001"
    : primaryRef.startsWith("NIST-")
      ? "NIST_CSF"
      : primaryRef.startsWith("HIPAA-")
        ? "HIPAA"
        : primaryRef.startsWith("GDPR-")
          ? "GDPR"
          : "SOC2";

  db.prepare(
    `INSERT INTO compliance_evidence
     (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, 'automation_action', 'automation-engine', ?, 'system', ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, created_at = excluded.created_at`,
  )
    .bind(
      id,
      tenantId,
      framework,
      primaryRef.replace(/^[A-Z0-9]+-/, ""),
      `${actionType}:${result.status}`,
      `automation:${actionType}:${Date.now()}`,
      config.appId ?? actionType,
      metadata,
    )
    .run()
    .catch(() => {
      /* best-effort — never block automation execution */
    });
}
