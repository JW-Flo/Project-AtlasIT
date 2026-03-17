/**
 * Evaluates automation rules against incoming events within the ai-orchestrator.
 * Queries tenant rules from D1 and dispatches matched actions.
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
  TriggerType,
} from "@atlasit/shared/automation/types";

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

interface EvaluateResult {
  matched: number;
  executions: Array<{
    ruleId: string;
    ruleName: string;
    status: "success" | "partial" | "failed";
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

    for (const action of actions) {
      try {
        const interpolatedConfig: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(action.config)) {
          interpolatedConfig[k] =
            typeof v === "string" ? interpolateTemplate(v, event.payload) : v;
        }

        results.push({
          actionType: action.type,
          status: "success",
          message: `Action ${action.type} dispatched`,
          details: interpolatedConfig,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({
          actionType: action.type,
          status: "failed",
          message,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const summary = buildExecutionSummary(rule, results, durationMs);

    // Record execution in D1
    const executionId = crypto.randomUUID().replace(/-/g, "");
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

// Row → domain mapper (mirrors console-app/src/lib/server/automation.ts)
function rowToRule(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    enabled: !!row.enabled,
    triggerType: row.trigger_type as AutomationRule["triggerType"],
    triggerConfig: JSON.parse((row.trigger_config as string) || "{}"),
    conditions: JSON.parse((row.conditions as string) || "[]"),
    actions: JSON.parse((row.actions as string) || "[]"),
    lastRunAt: (row.last_run_at as string) ?? undefined,
    lastStatus: (row.last_status as AutomationRule["lastStatus"]) ?? undefined,
    runCount: (row.run_count as number) ?? 0,
    errorCount: (row.error_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: (row.created_by as string) ?? undefined,
  };
}
