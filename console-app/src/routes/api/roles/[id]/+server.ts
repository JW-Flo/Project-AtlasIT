import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const roleRow = await queryPgOne<{
    id: string;
    name: string;
    description: string;
    parent_id: string | null;
    level: number;
    metadata: string | null;
    created_at: string;
    updated_at: string;
  }>(`SELECT * FROM roles WHERE id = $1 AND tenant_id = $2`, [params.id!, tenantId]);

  if (!roleRow) return json({ error: "Role not found" }, { status: 404 });

  const entitlements = await queryPg<{
    id: string;
    app_id: string;
    app_role: string;
    created_at: string;
  }>(
    `SELECT id, app_id, app_role, created_at FROM role_app_entitlements
     WHERE role_id = $1 AND tenant_id = $2`,
    [params.id!, tenantId],
  );

  const assignments = await queryPg<{
    id: string;
    target_type: string;
    target_id: string;
    created_at: string;
  }>(
    `SELECT id, target_type, target_id, created_at FROM role_assignments
     WHERE role_id = $1 AND tenant_id = $2`,
    [params.id!, tenantId],
  );

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
      entitlements: entitlements.map((e) => ({
        id: e.id,
        appId: e.app_id,
        appRole: e.app_role,
        createdAt: e.created_at,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        targetType: a.target_type,
        targetId: a.target_id,
        createdAt: a.created_at,
      })),
    },
  });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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

  const existing = await queryPgOne<{ id: string }>(
    `SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`,
    [params.id!, tenantId],
  );

  if (!existing) return json({ error: "Role not found" }, { status: 404 });

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (body.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(body.name);
  }
  if (body.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(body.description);
  }
  if (body.parentId !== undefined) {
    fields.push(`parent_id = $${paramIndex++}`);
    values.push(body.parentId);
  }
  if (body.level !== undefined) {
    fields.push(`level = $${paramIndex++}`);
    values.push(body.level);
  }
  if (body.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex++}`);
    values.push(body.metadata ? JSON.stringify(body.metadata) : null);
  }

  if (fields.length === 0) {
    return json({ error: "No fields to update" }, { status: 400 });
  }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(params.id!);
  values.push(tenantId);

  await queryPg(
    `UPDATE roles SET ${fields.join(", ")} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}`,
    values,
  );

  const updated = await queryPgOne<{
    id: string;
    name: string;
    description: string;
    parent_id: string | null;
    level: number;
    metadata: string | null;
    created_at: string;
    updated_at: string;
  }>(`SELECT * FROM roles WHERE id = $1 AND tenant_id = $2`, [params.id!, tenantId]);

  return json({
    role: {
      id: updated!.id,
      name: updated!.name,
      description: updated!.description,
      parentId: updated!.parent_id,
      level: updated!.level,
      metadata: updated!.metadata ? JSON.parse(updated!.metadata) : null,
      createdAt: updated!.created_at,
      updatedAt: updated!.updated_at,
    },
  });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const existing = await queryPgOne<{ id: string }>(
    `SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`,
    [params.id!, tenantId],
  );

  if (!existing) return json({ error: "Role not found" }, { status: 404 });

  await queryPg(`DELETE FROM roles WHERE id = $1 AND tenant_id = $2`, [params.id!, tenantId]);

  return json({ ok: true });
};
