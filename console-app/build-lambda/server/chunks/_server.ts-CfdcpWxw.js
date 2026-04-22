import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { t as toCamel } from './dto-qzAL3BiV.js';

const GET = async ({ params, platform, locals }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin", "member"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  try {
    const row = await db.prepare(`SELECT * FROM dead_letter_queue WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
    if (!row) {
      return json({ error: "Not found" }, { status: 404 });
    }
    return json({ entry: toCamel(row) });
  } catch (err) {
    if (err?.message?.includes("no such table")) {
      return json({ error: "Not found" }, { status: 404 });
    }
    console.error("[dead-letter/id] D1 query error:", err);
    return json({ error: "Failed to fetch dead letter entry" }, { status: 500 });
  }
};
const POST = async ({ params, platform, locals }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  try {
    const existing = await db.prepare(`SELECT id FROM dead_letter_queue WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
    if (!existing) {
      return json({ error: "Not found" }, { status: 404 });
    }
    await db.prepare(
      `UPDATE dead_letter_queue SET replay_status = 'pending', replayed_at = datetime('now') WHERE id = ? AND tenant_id = ?`
    ).bind(params.id, tenantId).run();
    return json({ status: "replay_queued", id: params.id });
  } catch (err) {
    if (err?.message?.includes("no such table")) {
      return json({ error: "Not found" }, { status: 404 });
    }
    console.error("[dead-letter/id] replay error:", err);
    return json({ error: "Failed to queue replay" }, { status: 500 });
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts-CfdcpWxw.js.map
