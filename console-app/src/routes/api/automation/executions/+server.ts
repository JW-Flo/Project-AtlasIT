import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ executions: [], total: 0 });

  const ruleId = url.searchParams.get("ruleId") ?? null;
  const status = url.searchParams.get("status") ?? null;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);

  // Build query with optional filters, joining rule name for display
  const filters: string[] = ["e.tenant_id = ?"];
  const binds: (string | number)[] = [tenantId];

  if (ruleId) {
    filters.push("e.rule_id = ?");
    binds.push(ruleId);
  }
  if (status) {
    filters.push("e.status = ?");
    binds.push(status);
  }

  const from = url.searchParams.get("from") ?? null;
  const to = url.searchParams.get("to") ?? null;
  if (from) {
    filters.push("e.started_at >= ?");
    binds.push(from);
  }
  if (to) {
    filters.push("e.started_at <= ?");
    binds.push(to);
  }

  const where = filters.join(" AND ");

  const [rowsResult, countResult] = await Promise.all([
    db
      .prepare(
        `SELECT e.*, r.name AS rule_name
         FROM automation_executions e
         LEFT JOIN automation_rules r ON r.id = e.rule_id
         WHERE ${where}
         ORDER BY e.started_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(...binds, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM automation_executions e WHERE ${where}`)
      .bind(...binds)
      .first<{ cnt: number }>(),
  ]);

  const executions = (rowsResult.results ?? []).map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    ruleId: row.rule_id,
    ruleName: row.rule_name ?? null,
    triggerEvent: JSON.parse(row.trigger_event || "{}"),
    status: row.status,
    actionsRun: row.actions_run ?? 0,
    actionsFailed: row.actions_failed ?? 0,
    results: row.results ? JSON.parse(row.results) : undefined,
    durationMs: row.duration_ms ?? null,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? null,
  }));

  return json({ executions, total: countResult?.cnt ?? 0 });
};
