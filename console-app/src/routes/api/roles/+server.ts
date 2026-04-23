import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const results = await queryPg(
    `SELECT r.id, r.name, r.description, r.parent_id, r.level, r.created_at,
            COUNT(DISTINCT e.id) AS entitlement_count,
            COUNT(DISTINCT a.id) AS assignment_count
     FROM roles r
     LEFT JOIN role_app_entitlements e ON e.role_id = r.id AND e.tenant_id = r.tenant_id
     LEFT JOIN role_assignments a ON a.role_id = r.id AND a.tenant_id = r.tenant_id
     WHERE r.tenant_id = $1
     GROUP BY r.id
     ORDER BY r.level ASC, r.name ASC`,
    [tenantId],
  );

  const roles = results.map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    parentId: r.parent_id,
    level: r.level,
    entitlementCount: r.entitlement_count,
    assignmentCount: r.assignment_count,
    createdAt: r.created_at,
  }));

  return json({ roles });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
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
  const now = new Date().toISOString();

  await queryPg(
    `INSERT INTO roles (id, tenant_id, name, description, parent_id, level, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      tenantId,
      name,
      description ?? "",
      parentId ?? null,
      level ?? 0,
      metadata ? JSON.stringify(metadata) : null,
      now,
      now,
    ],
  );

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
        updatedAt: now,
      },
    },
    { status: 201 },
  );
};
