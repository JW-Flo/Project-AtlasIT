import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ simulations: [] });

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;
  const ruleId = url.searchParams.get("ruleId");

  const filters = ["tenant_id = ?"];
  const binds: (string | number)[] = [tenantId];

  if (ruleId) {
    filters.push("rule_id = ?");
    binds.push(ruleId);
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  const [countResult, rowsResult] = await Promise.all([
    db
      .prepare(`SELECT COUNT(*) as total FROM automation_simulations ${where}`)
      .bind(...binds)
      .first()
      .catch(() => ({ total: 0 })),
    db
      .prepare(
        `SELECT id, rule_id, rule_name, trigger_event, matched, actions_preview, condition_results, ran_by, created_at
         FROM automation_simulations ${where}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...binds, limit, offset)
      .all()
      .catch(() => ({ results: [] })),
  ]);

  const simulations = (rowsResult.results ?? []).map((row: any) => ({
    id: row.id,
    ruleId: row.rule_id,
    ruleName: row.rule_name,
    event: JSON.parse(row.trigger_event || "{}"),
    matched: !!row.matched,
    actions: JSON.parse(row.actions_preview || "[]"),
    conditionResults: JSON.parse(row.condition_results || "[]"),
    ranBy: row.ran_by,
    createdAt: row.created_at,
  }));

  return json({
    simulations,
    total: (countResult as any)?.total ?? 0,
  });
};
