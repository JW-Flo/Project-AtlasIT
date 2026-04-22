import { json } from '@sveltejs/kit';
import { queryPg } from './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const GET = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1e3).toISOString();
  const [totalsResult, dailyResult, topRulesResult] = await Promise.all([
    queryPg(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
         SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial,
         AVG(duration_ms) AS avg_duration
       FROM automation_executions
       WHERE tenant_id = $1 AND started_at >= $2`,
      [tenantId, since]
    ).catch(() => []),
    queryPg(
      `SELECT
         date(started_at) AS day,
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM automation_executions
       WHERE tenant_id = $1 AND started_at >= $2
       GROUP BY date(started_at)
       ORDER BY day ASC`,
      [tenantId, since]
    ).catch(() => []),
    queryPg(
      `SELECT
         e.rule_id,
         r.name AS rule_name,
         COUNT(*) AS exec_count,
         SUM(CASE WHEN e.status = 'success' THEN 1 ELSE 0 END) AS success_count
       FROM automation_executions e
       LEFT JOIN automation_rules r ON r.id = e.rule_id
       WHERE e.tenant_id = $1 AND e.started_at >= $2
       GROUP BY e.rule_id
       ORDER BY exec_count DESC
       LIMIT 5`,
      [tenantId, since]
    ).catch(() => [])
  ]);
  const t = totalsResult[0];
  const totals = {
    executions: t?.total ?? 0,
    success: t?.success ?? 0,
    failed: t?.failed ?? 0,
    partial: t?.partial ?? 0,
    avgDurationMs: Math.round(t?.avg_duration ?? 0)
  };
  const daily = dailyResult.map((row) => ({
    date: row.day,
    total: row.total ?? 0,
    success: row.success ?? 0,
    failed: row.failed ?? 0
  }));
  const topRules = topRulesResult.map((row) => ({
    ruleId: row.rule_id,
    ruleName: row.rule_name ?? "Unknown",
    executions: row.exec_count ?? 0,
    successRate: row.exec_count > 0 ? Math.round((row.success_count ?? 0) / row.exec_count * 100) / 100 : 0
  }));
  return json({
    period: { days, since },
    totals,
    daily,
    topRules
  });
};

export { GET };
//# sourceMappingURL=_server.ts-Cvsoyxbu.js.map
