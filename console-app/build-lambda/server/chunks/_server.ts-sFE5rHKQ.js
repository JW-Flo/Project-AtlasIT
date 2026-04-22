import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';

const GET = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const { results } = await db.prepare(
    `SELECT id, target_type, target_id, created_at FROM role_assignments
       WHERE role_id = ? AND tenant_id = ?`
  ).bind(params.id, tenantId).all();
  return json({
    assignments: (results ?? []).map((a) => ({
      id: a.id,
      targetType: a.target_type,
      targetId: a.target_id,
      createdAt: a.created_at
    }))
  });
};
const POST = async ({ params, request, locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { targetType, targetId } = body;
  if (!targetType || !targetId) {
    return json({ error: "targetType and targetId are required" }, { status: 400 });
  }
  if (targetType !== "user" && targetType !== "group") {
    return json({ error: "targetType must be 'user' or 'group'" }, { status: 400 });
  }
  const role = await db.prepare(`SELECT id FROM roles WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
  if (!role) return json({ error: "Role not found" }, { status: 404 });
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO role_assignments (id, tenant_id, role_id, target_type, target_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, tenantId, params.id, targetType, targetId, now).run();
  return json(
    {
      assignment: {
        id,
        targetType,
        targetId,
        createdAt: now
      }
    },
    { status: 201 }
  );
};
const DELETE = async ({ params, url, locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");
  if (!targetType || !targetId) {
    return json(
      { error: "targetType and targetId query parameters are required" },
      { status: 400 }
    );
  }
  const existing = await db.prepare(
    `SELECT id FROM role_assignments
       WHERE role_id = ? AND tenant_id = ? AND target_type = ? AND target_id = ?`
  ).bind(params.id, tenantId, targetType, targetId).first();
  if (!existing) return json({ error: "Assignment not found" }, { status: 404 });
  await db.prepare(
    `DELETE FROM role_assignments
       WHERE role_id = ? AND tenant_id = ? AND target_type = ? AND target_id = ?`
  ).bind(params.id, tenantId, targetType, targetId).run();
  return json({ ok: true });
};

export { DELETE, GET, POST };
//# sourceMappingURL=_server.ts-sFE5rHKQ.js.map
