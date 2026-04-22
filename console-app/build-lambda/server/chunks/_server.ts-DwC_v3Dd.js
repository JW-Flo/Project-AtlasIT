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
  const ruleId = url.searchParams.get("ruleId") ?? null;
  const status = url.searchParams.get("status") ?? null;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);
  const filters = ["e.tenant_id = $1"];
  const binds = [tenantId];
  let paramIndex = 2;
  if (ruleId) {
    filters.push(`e.rule_id = $${paramIndex++}`);
    binds.push(ruleId);
  }
  if (status) {
    filters.push(`e.status = $${paramIndex++}`);
    binds.push(status);
  }
  const from = url.searchParams.get("from") ?? null;
  const to = url.searchParams.get("to") ?? null;
  if (from) {
    filters.push(`e.started_at >= $${paramIndex++}`);
    binds.push(from);
  }
  if (to) {
    filters.push(`e.started_at <= $${paramIndex++}`);
    binds.push(to);
  }
  const where = filters.join(" AND ");
  const [rowsResult, countResult] = await Promise.all([
    queryPg(
      `SELECT e.*, r.name AS rule_name
       FROM automation_executions e
       LEFT JOIN automation_rules r ON r.id = e.rule_id
       WHERE ${where}
       ORDER BY e.started_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...binds, limit, offset]
    ),
    queryPg(
      `SELECT COUNT(*) AS cnt FROM automation_executions e WHERE ${where}`,
      binds
    )
  ]);
  const executions = rowsResult.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    ruleId: row.rule_id,
    ruleName: row.rule_name ?? null,
    triggerEvent: JSON.parse(row.trigger_event || "{}"),
    status: row.status,
    actionsRun: row.actions_run ?? 0,
    actionsFailed: row.actions_failed ?? 0,
    results: row.results ? JSON.parse(row.results) : void 0,
    durationMs: row.duration_ms ?? null,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? null
  }));
  return json({ executions, total: countResult[0]?.cnt ?? 0 });
};

export { GET };
//# sourceMappingURL=_server.ts-DwC_v3Dd.js.map
