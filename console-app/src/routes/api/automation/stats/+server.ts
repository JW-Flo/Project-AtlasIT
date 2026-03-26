import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db)
    return json({
      period: { days: 30, since: new Date().toISOString() },
      totals: { executions: 0, success: 0, failed: 0, partial: 0, avgDurationMs: 0 },
      daily: [],
      topRules: [],
    });

  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [totalsResult, dailyResult, topRulesResult] = await Promise.all([
    db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
           SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial,
           AVG(duration_ms) AS avg_duration
         FROM automation_executions
         WHERE tenant_id = ? AND started_at >= ?`,
      )
      .bind(tenantId, since)
      .first()
      .catch(() => null),
    db
      .prepare(
        `SELECT
           date(started_at) AS day,
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
         FROM automation_executions
         WHERE tenant_id = ? AND started_at >= ?
         GROUP BY date(started_at)
         ORDER BY day ASC`,
      )
      .bind(tenantId, since)
      .all()
      .catch(() => ({ results: [] })),
    db
      .prepare(
        `SELECT
           e.rule_id,
           r.name AS rule_name,
           COUNT(*) AS exec_count,
           SUM(CASE WHEN e.status = 'success' THEN 1 ELSE 0 END) AS success_count
         FROM automation_executions e
         LEFT JOIN automation_rules r ON r.id = e.rule_id
         WHERE e.tenant_id = ? AND e.started_at >= ?
         GROUP BY e.rule_id
         ORDER BY exec_count DESC
         LIMIT 5`,
      )
      .bind(tenantId, since)
      .all()
      .catch(() => ({ results: [] })),
  ]);

  const t = totalsResult as any;
  const totals = {
    executions: t?.total ?? 0,
    success: t?.success ?? 0,
    failed: t?.failed ?? 0,
    partial: t?.partial ?? 0,
    avgDurationMs: Math.round(t?.avg_duration ?? 0),
  };

  const daily = ((dailyResult as any).results ?? []).map((row: any) => ({
    date: row.day,
    total: row.total ?? 0,
    success: row.success ?? 0,
    failed: row.failed ?? 0,
  }));

  const topRules = ((topRulesResult as any).results ?? []).map((row: any) => ({
    ruleId: row.rule_id,
    ruleName: row.rule_name ?? "Unknown",
    executions: row.exec_count ?? 0,
    successRate:
      row.exec_count > 0 ? Math.round(((row.success_count ?? 0) / row.exec_count) * 100) / 100 : 0,
  }));

  return json({
    period: { days, since },
    totals,
    daily,
    topRules,
  });
};
