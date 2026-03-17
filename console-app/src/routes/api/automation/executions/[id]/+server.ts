import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

/**
 * GET /api/automation/executions/:id
 * Returns full execution detail including rule name and parsed results.
 */
export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const row = await db
    .prepare(
      `SELECT e.*, r.name as rule_name, r.trigger_type
       FROM automation_executions e
       LEFT JOIN automation_rules r ON r.id = e.rule_id
       WHERE e.id = ? AND e.tenant_id = ?`,
    )
    .bind(params.id, tenantId)
    .first();

  if (!row) {
    return json({ error: "Execution not found" }, { status: 404 });
  }

  return json({
    execution: {
      id: row.id,
      tenantId: row.tenant_id,
      ruleId: row.rule_id,
      ruleName: row.rule_name ?? "Unknown rule",
      triggerType: row.trigger_type ?? undefined,
      triggerEvent: JSON.parse((row.trigger_event as string) || "{}"),
      status: row.status,
      actionsRun: row.actions_run ?? 0,
      actionsFailed: row.actions_failed ?? 0,
      results: row.results ? JSON.parse(row.results as string) : [],
      durationMs: row.duration_ms ?? undefined,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
    },
  });
};
