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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;
  const ruleId = url.searchParams.get("ruleId");
  const filters = ["tenant_id = $1"];
  const binds = [tenantId];
  let paramIndex = 2;
  if (ruleId) {
    filters.push(`rule_id = $${paramIndex++}`);
    binds.push(ruleId);
  }
  const where = `WHERE ${filters.join(" AND ")}`;
  const [countResult, rowsResult] = await Promise.all([
    queryPg(
      `SELECT COUNT(*) as total FROM automation_simulations ${where}`,
      binds
    ).catch(() => [{ total: 0 }]),
    queryPg(
      `SELECT id, rule_id, rule_name, trigger_event, matched, actions_preview, condition_results, ran_by, created_at
       FROM automation_simulations ${where}
       ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...binds, limit, offset]
    ).catch(() => [])
  ]);
  const simulations = rowsResult.map((row) => ({
    id: row.id,
    ruleId: row.rule_id,
    ruleName: row.rule_name,
    event: JSON.parse(row.trigger_event || "{}"),
    matched: !!row.matched,
    actions: JSON.parse(row.actions_preview || "[]"),
    conditionResults: JSON.parse(row.condition_results || "[]"),
    ranBy: row.ran_by,
    createdAt: row.created_at
  }));
  return json({
    simulations,
    total: countResult[0]?.total ?? 0
  });
};

export { GET };
//# sourceMappingURL=_server.ts-CFci2DER.js.map
