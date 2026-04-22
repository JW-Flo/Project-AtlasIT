import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const { results } = await db.prepare(
    `SELECT r.id, r.name, r.description, r.parent_id, r.level, r.created_at,
              COUNT(DISTINCT e.id) AS entitlement_count,
              COUNT(DISTINCT a.id) AS assignment_count
       FROM roles r
       LEFT JOIN role_app_entitlements e ON e.role_id = r.id AND e.tenant_id = r.tenant_id
       LEFT JOIN role_assignments a ON a.role_id = r.id AND a.tenant_id = r.tenant_id
       WHERE r.tenant_id = ?
       GROUP BY r.id
       ORDER BY r.level ASC, r.name ASC`
  ).bind(tenantId).all();
  const roles = (results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    parentId: r.parent_id,
    level: r.level,
    entitlementCount: r.entitlement_count,
    assignmentCount: r.assignment_count,
    createdAt: r.created_at
  }));
  return json({ roles });
};
const POST = async ({ request, locals, platform }) => {
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
  const { name, description, parentId, level, metadata } = body;
  if (!name) {
    return json({ error: "name is required" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO roles (id, tenant_id, name, description, parent_id, level, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    tenantId,
    name,
    description ?? "",
    parentId ?? null,
    level ?? 0,
    metadata ? JSON.stringify(metadata) : null,
    now,
    now
  ).run();
  return json(
    {
      role: {
        id,
        name,
        description: description ?? null,
        parentId: parentId ?? null,
        level: level ?? 0,
        metadata: metadata ?? null,
        createdAt: now,
        updatedAt: now
      }
    },
    { status: 201 }
  );
};

export { GET, POST };
//# sourceMappingURL=_server.ts-Du35akl2.js.map
