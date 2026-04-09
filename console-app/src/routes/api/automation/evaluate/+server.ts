import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listRules, recordExecution } from "$lib/server/automation";
import { executeAction } from "$lib/server/automation-actions";
import { writeAudit } from "$lib/server/audit";
import {
  matchRules,
  sortActions,
  buildExecutionSummary,
  interpolateTemplate,
} from "@atlasit/shared";
import type { AutomationEvent, ActionResult } from "@atlasit/shared";

/**
 * Evaluate an automation event against tenant rules and execute matching actions.
 * Called internally by other API routes (directory sync, app connect, health check, etc.)
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const orchestratorUrl = (platform?.env as any)?.ORCHESTRATOR_URL as string | undefined;
  const serviceApiKey = ((platform?.env as any)?.ORCHESTRATOR_API_KEY || (platform?.env as any)?.INTERNAL_API_KEY || "") as string;

  let event: AutomationEvent;
  try {
    event = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!event.type || !event.payload) {
    return json({ error: "type and payload are required" }, { status: 400 });
  }

  event.tenantId = tenantId;
  event.timestamp = event.timestamp || new Date().toISOString();

  // Find matching rules
  const allRules = await listRules(db, tenantId);
  const matched = matchRules(allRules, event);

  if (matched.length === 0) {
    return json({ matched: 0, results: [] });
  }

  const allResults: Array<{
    ruleId: string;
    ruleName: string;
    results: ActionResult[];
  }> = [];

  for (const rule of matched) {
    const startTime = Date.now();
    const actions = sortActions(rule.actions);
    const results: ActionResult[] = [];

    for (const action of actions) {
      try {
        const interpolatedConfig = interpolateConfig(action.config, event.payload);

        const result = await executeAction(action.type, interpolatedConfig, {
          db,
          tenantId,
          payload: event.payload,
          orchestratorUrl,
          serviceApiKey,
        });
        results.push(result);
      } catch (err: any) {
        results.push({
          actionType: action.type,
          status: "failed",
          message: err?.message || "Unknown error",
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const summary = buildExecutionSummary(rule, results, durationMs);

    await recordExecution(db, tenantId, rule.id, {
      triggerEvent: event.payload,
      status: summary.status,
      actionsRun: summary.actionsRun,
      actionsFailed: summary.actionsFailed,
      results,
      durationMs: summary.durationMs,
      startedAt: event.timestamp,
      completedAt: new Date().toISOString(),
    });

    await writeAudit(db, {
      tenantId,
      actorUserId: "system",
      actorEmail: "automation@atlasit.io",
      action: "automation.executed",
      targetType: "automation_rule",
      targetId: rule.id,
      detail: JSON.stringify({
        ruleName: rule.name,
        triggerType: event.type,
        status: summary.status,
        actionsRun: summary.actionsRun,
        durationMs,
      }),
    });

    allResults.push({ ruleId: rule.id, ruleName: rule.name, results });
  }

  return json({ matched: matched.length, results: allResults });
};

function interpolateConfig(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = typeof v === "string" ? interpolateTemplate(v, payload) : v;
  }
  return out;
}
