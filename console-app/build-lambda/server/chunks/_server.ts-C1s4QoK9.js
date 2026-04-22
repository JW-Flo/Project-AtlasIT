import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const severity = url.searchParams.get("severity");
  let query = `SELECT id, tenant_id, insight_type, severity, category, data, resolved_at, created_at
               FROM compliance_insights
               WHERE tenant_id = ? AND insight_type = 'drift'`;
  const bindings = [tenantId];
  if (severity) {
    query += " AND severity = ?";
    bindings.push(severity);
  }
  query += " ORDER BY created_at DESC LIMIT ?";
  bindings.push(limit);
  const { results } = await db.prepare(query).bind(...bindings).all();
  const alerts = (results ?? []).map((row) => {
    let data = {};
    try {
      data = JSON.parse(row.data);
    } catch {
    }
    return {
      id: row.id,
      severity: row.severity,
      category: row.category,
      data,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at
    };
  });
  return json({ tenantId, alerts, total: alerts.length });
};

export { GET };
//# sourceMappingURL=_server.ts-C1s4QoK9.js.map
