import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";
import { toCamel } from "$lib/utils/dto";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const { id } = params;

  const group = await db
    .prepare(
      `SELECT g.id, g.external_id, g.name, g.description, g.created_at, g.updated_at,
              (SELECT COUNT(*) FROM directory_memberships WHERE group_id = g.id) as member_count
       FROM directory_groups g
       WHERE g.id = ? AND g.tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  if (!group) return json({ error: "not found" }, { status: 404 });

  const members = await db
    .prepare(
      `SELECT u.id, u.email, u.display_name, u.department, u.title, u.status, m.created_at as joined_at
       FROM directory_memberships m
       JOIN directory_users u ON u.id = m.user_id
       WHERE m.group_id = ? AND m.tenant_id = ?
       ORDER BY u.display_name ASC`,
    )
    .bind(id, tenantId)
    .all()
    .then((r: any) => r.results || []);

  const { results: appMappingRows } = await db
    .prepare("SELECT id, app_id, role, suggested FROM group_app_mappings WHERE tenant_id = ? AND group_id = ?")
    .bind(tenantId, id)
    .all();

  const appMappings = (appMappingRows || []).map((row: any) => ({
    id: row.id,
    appId: row.app_id,
    role: row.role,
    suggested: row.suggested,
  }));

  return json({ group: toCamel(group), members: toCamel(members), appMappings });
};

export const PATCH: RequestHandler = async ({
  params,
  request,
  locals,
  platform,
}) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const { id } = params;

  const existing = await db
    .prepare(`SELECT id FROM directory_groups WHERE id = ? AND tenant_id = ?`)
    .bind(id, tenantId)
    .first();

  if (!existing) return json({ error: "not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "invalid body" }, { status: 400 });

  const { name, description } = body;
  const now = new Date().toISOString();

  const fields: string[] = [];
  const binds: any[] = [];

  if (name !== undefined) {
    fields.push("name = ?");
    binds.push(name);
  }
  if (description !== undefined) {
    fields.push("description = ?");
    binds.push(description);
  }

  if (fields.length === 0)
    return json({ error: "no fields to update" }, { status: 400 });

  fields.push("updated_at = ?");
  binds.push(now, id, tenantId);

  await db
    .prepare(
      `UPDATE directory_groups SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`,
    )
    .bind(...binds)
    .run();

  const updated = await db
    .prepare(
      `SELECT id, external_id, name, description, created_at, updated_at FROM directory_groups WHERE id = ? AND tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "directory_group.updated",
    targetType: "directory_group",
    targetId: id,
  });

  return json({ group: toCamel(updated) });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const { id } = params;

  const existing = await db
    .prepare(
      `SELECT id, name FROM directory_groups WHERE id = ? AND tenant_id = ?`,
    )
    .bind(id, tenantId)
    .first();

  if (!existing) return json({ error: "not found" }, { status: 404 });

  await db
    .prepare(
      `DELETE FROM directory_memberships WHERE group_id = ? AND tenant_id = ?`,
    )
    .bind(id, tenantId)
    .run();

  await db
    .prepare(
      `DELETE FROM group_app_mappings WHERE group_id = ? AND tenant_id = ?`,
    )
    .bind(id, tenantId)
    .run();

  await db
    .prepare(`DELETE FROM directory_groups WHERE id = ? AND tenant_id = ?`)
    .bind(id, tenantId)
    .run();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "directory_group.deleted",
    targetType: "directory_group",
    targetId: id,
    detail: existing.name,
  });

  return json({ success: true });
};
