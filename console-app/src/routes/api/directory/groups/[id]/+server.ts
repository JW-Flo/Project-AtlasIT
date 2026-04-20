import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAuditPg } from "$lib/server/audit";
import { toCamel } from "$lib/utils/dto";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const { id } = params;

  try {
    const group = await queryPgOne<any>(
      `SELECT g.id, g.external_id, g.name, g.description, g.created_at, g.updated_at,
              (SELECT COUNT(*) FROM directory_memberships WHERE group_id = g.id) as member_count
       FROM directory_groups g
       WHERE g.id = $1 AND g.tenant_id = $2`,
      [id, tenantId],
    );

    if (!group) return json({ error: "not found" }, { status: 404 });

    const members = await queryPg<any>(
      `SELECT u.id, u.email, u.display_name, u.department, u.title, u.status, m.created_at as joined_at
       FROM directory_memberships m
       JOIN directory_users u ON u.id = m.user_id
       WHERE m.group_id = $1 AND m.tenant_id = $2
       ORDER BY u.display_name ASC`,
      [id, tenantId],
    );

    const appMappings = await queryPg<any>(
      "SELECT id, app_id, role, suggested FROM group_app_mappings WHERE tenant_id = $1 AND group_id = $2",
      [tenantId, id],
    );

    const appMappingsCamel = appMappings.map((row: any) => ({
      id: row.id,
      appId: row.app_id,
      role: row.role,
      suggested: row.suggested,
    }));

    return json({
      group: toCamel(group),
      members: toCamel(members),
      appMappings: appMappingsCamel,
    });
  } catch (e) {
    console.error("Group detail error:", e);
    return json({ error: "Failed to load group" }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const { id } = params;

  try {
    const existing = await queryPgOne<any>(
      `SELECT id FROM directory_groups WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    if (!existing) return json({ error: "not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "invalid body" }, { status: 400 });

    const { name, description } = body;
    const fields: string[] = [];
    const binds: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      binds.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      binds.push(description);
    }

    if (fields.length === 0) return json({ error: "no fields to update" }, { status: 400 });

    fields.push(`updated_at = NOW()`);
    binds.push(id, tenantId);

    await queryPg(
      `UPDATE directory_groups SET ${fields.join(", ")} WHERE id = $${idx} AND tenant_id = $${idx + 1}`,
      binds,
    );

    const updated = await queryPgOne<any>(
      `SELECT id, external_id, name, description, created_at, updated_at FROM directory_groups WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    await writeAuditPg({
      tenantId,
      actorUserId: user.userId ?? user.id,
      actorEmail: user.email,
      action: "directory_group.updated",
      targetType: "directory_group",
      targetId: id,
    });

    return json({ group: toCamel(updated) });
  } catch (e) {
    console.error("Group update error:", e);
    return json({ error: "Failed to update group" }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const { id } = params;

  try {
    const existing = await queryPgOne<any>(
      `SELECT id, name FROM directory_groups WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    if (!existing) return json({ error: "not found" }, { status: 404 });

    await queryPg(`DELETE FROM directory_memberships WHERE group_id = $1 AND tenant_id = $2`, [
      id,
      tenantId,
    ]);

    await queryPg(`DELETE FROM group_app_mappings WHERE group_id = $1 AND tenant_id = $2`, [
      id,
      tenantId,
    ]);

    await queryPg(`DELETE FROM directory_groups WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);

    await writeAuditPg({
      tenantId,
      actorUserId: user.userId ?? user.id,
      actorEmail: user.email,
      action: "directory_group.deleted",
      targetType: "directory_group",
      targetId: id,
      detail: existing.name,
    });

    return json({ success: true });
  } catch (e) {
    console.error("Group delete error:", e);
    return json({ error: "Failed to delete group" }, { status: 500 });
  }
};
