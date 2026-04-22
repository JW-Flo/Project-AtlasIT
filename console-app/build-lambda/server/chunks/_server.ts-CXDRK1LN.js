import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { t as toCamel } from './dto-qzAL3BiV.js';

const GET = async ({ url, platform, locals }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin", "member"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  try {
    const [rows, countRow] = await Promise.all([
      db.prepare(
        `SELECT * FROM dead_letter_queue WHERE tenant_id = ? ORDER BY dead_lettered_at DESC LIMIT ? OFFSET ?`
      ).bind(tenantId, limit, offset).all(),
      db.prepare(`SELECT COUNT(*) AS total FROM dead_letter_queue WHERE tenant_id = ?`).bind(tenantId).first()
    ]);
    return json({
      entries: toCamel(rows.results ?? []),
      total: countRow?.total ?? 0
    });
  } catch (err) {
    if (err?.message?.includes("no such table")) {
      return json({ entries: [], total: 0 });
    }
    console.error("[dead-letter] D1 query error:", err);
    return json({ error: "Failed to fetch dead letter entries" }, { status: 500 });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-CXDRK1LN.js.map
