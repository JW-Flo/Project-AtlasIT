import { json } from '@sveltejs/kit';

const GET = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const roleRow = await db.prepare(`SELECT * FROM roles WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
  if (!roleRow) return json({ error: "Role not found" }, { status: 404 });
  const { results: entitlements } = await db.prepare(
    `SELECT id, app_id, app_role, created_at FROM role_app_entitlements
       WHERE role_id = ? AND tenant_id = ?`
  ).bind(params.id, tenantId).all();
  const { results: assignments } = await db.prepare(
    `SELECT id, target_type, target_id, created_at FROM role_assignments
       WHERE role_id = ? AND tenant_id = ?`
  ).bind(params.id, tenantId).all();
  return json({
    role: {
      id: roleRow.id,
      name: roleRow.name,
      description: roleRow.description,
      parentId: roleRow.parent_id,
      level: roleRow.level,
      metadata: roleRow.metadata ? JSON.parse(roleRow.metadata) : null,
      createdAt: roleRow.created_at,
      updatedAt: roleRow.updated_at,
      entitlements: (entitlements ?? []).map((e) => ({
        id: e.id,
        appId: e.app_id,
        appRole: e.app_role,
        createdAt: e.created_at
      })),
      assignments: (assignments ?? []).map((a) => ({
        id: a.id,
        targetType: a.target_type,
        targetId: a.target_id,
        createdAt: a.created_at
      }))
    }
  });
};
const PATCH = async ({ params, request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
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
  const existing = await db.prepare(`SELECT id FROM roles WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
  if (!existing) return json({ error: "Role not found" }, { status: 404 });
  const fields = [];
  const values = [];
  if (body.name !== void 0) {
    fields.push("name = ?");
    values.push(body.name);
  }
  if (body.description !== void 0) {
    fields.push("description = ?");
    values.push(body.description);
  }
  if (body.parentId !== void 0) {
    fields.push("parent_id = ?");
    values.push(body.parentId);
  }
  if (body.level !== void 0) {
    fields.push("level = ?");
    values.push(body.level);
  }
  if (body.metadata !== void 0) {
    fields.push("metadata = ?");
    values.push(body.metadata ? JSON.stringify(body.metadata) : null);
  }
  if (fields.length === 0) {
    return json({ error: "No fields to update" }, { status: 400 });
  }
  fields.push("updated_at = ?");
  values.push((/* @__PURE__ */ new Date()).toISOString());
  values.push(params.id, tenantId);
  await db.prepare(`UPDATE roles SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`).bind(...values).run();
  const updated = await db.prepare(`SELECT * FROM roles WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
  return json({
    role: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      parentId: updated.parent_id,
      level: updated.level,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    }
  });
};
const DELETE = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const existing = await db.prepare(`SELECT id FROM roles WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).first();
  if (!existing) return json({ error: "Role not found" }, { status: 404 });
  await db.prepare(`DELETE FROM roles WHERE id = ? AND tenant_id = ?`).bind(params.id, tenantId).run();
  return json({ ok: true });
};

export { DELETE, GET, PATCH };
//# sourceMappingURL=_server.ts-BGaMcbWA.js.map
