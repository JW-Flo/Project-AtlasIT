import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";

/**
 * GET /api/compliance-intelligence/drift
 * Returns recent drift alerts for the authenticated tenant.
 * Query params:
 *   - severity: filter by severity ("critical", "high", "medium", "low")
 *   - limit: max results (default 50)
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const severity = url.searchParams.get("severity");

  let query = `SELECT id, tenant_id, insight_type, severity, category, data, resolved_at, created_at
               FROM compliance_insights
               WHERE tenant_id = $1 AND insight_type = $2`;
  const bindings: unknown[] = [tenantId, "drift"];

  if (severity) {
    query += " AND severity = $3";
    bindings.push(severity);
    query += " ORDER BY created_at DESC LIMIT $4";
    bindings.push(limit);
  } else {
    query += " ORDER BY created_at DESC LIMIT $3";
    bindings.push(limit);
  }

  const results = await queryPg<{
    id: string;
    tenant_id: string;
    insight_type: string;
    severity: string;
    category: string | null;
    data: string;
    resolved_at: string | null;
    created_at: string;
  }>(query, bindings);

  const alerts = results.map((row) => {
    let data: unknown = {};
    try {
      data = JSON.parse(row.data);
    } catch {
      /* malformed JSON */
    }
    return {
      id: row.id,
      severity: row.severity,
      category: row.category,
      data,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
    };
  });

  return json({ tenantId, alerts, total: alerts.length });
};
