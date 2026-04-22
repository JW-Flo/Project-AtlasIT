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
    `SELECT id, app_id, app_role, created_at FROM role_app_entitlements
       WHERE role_id = ? AND tenant_id = ?`
  ).bind(params.id, tenantId).all();
  return json({
    entitlements: (results ?? []).map((e) => ({
      id: e.id,
      appId: e.app_id,
      appRole: e.app_role,
      createdAt: e.created_at
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
  const { appId, appRole } = body;
  if (!appId) {
    return json({ error: "appId is required" }, { status: 400 });
  }
  const role = await db.prepare(`SELECT id FROM roles WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
  if (!role) return json({ error: "Role not found" }, { status: 404 });
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO role_app_entitlements (id, tenant_id, role_id, app_id, app_role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, tenantId, params.id, appId, appRole ?? "member", now).run();
  return json(
    {
      entitlement: {
        id,
        appId,
        appRole: appRole ?? "member",
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
  const appId = url.searchParams.get("appId");
  if (!appId) {
    return json({ error: "appId query parameter is required" }, { status: 400 });
  }
  const existing = await db.prepare(
    `SELECT id FROM role_app_entitlements
       WHERE role_id = ? AND tenant_id = ? AND app_id = ?`
  ).bind(params.id, tenantId, appId).first();
  if (!existing) return json({ error: "Entitlement not found" }, { status: 404 });
  await db.prepare(
    `DELETE FROM role_app_entitlements
       WHERE role_id = ? AND tenant_id = ? AND app_id = ?`
  ).bind(params.id, tenantId, appId).run();
  return json({ ok: true });
};

export { DELETE, GET, POST };
//# sourceMappingURL=_server.ts-vGP25lbA.js.map
