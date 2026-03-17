import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const { id } = params;

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

  return json({ members });
};

export const POST: RequestHandler = async ({
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

  const { id: groupId } = params;

  const body = await request.json().catch(() => null);
  if (!body?.userId)
    return json({ error: "userId is required" }, { status: 400 });

  const { userId } = body;

  // Verify group exists in tenant
  const group = await db
    .prepare(
      `SELECT id, name FROM directory_groups WHERE id = ? AND tenant_id = ?`,
    )
    .bind(groupId, tenantId)
    .first();

  if (!group) return json({ error: "group not found" }, { status: 404 });

  // Verify user exists in tenant
  const dirUser = await db
    .prepare(
      `SELECT id, email FROM directory_users WHERE id = ? AND tenant_id = ?`,
    )
    .bind(userId, tenantId)
    .first();

  if (!dirUser) return json({ error: "user not found" }, { status: 404 });

  // Check if already a member
  const existing = await db
    .prepare(
      `SELECT id FROM directory_memberships WHERE group_id = ? AND user_id = ? AND tenant_id = ?`,
    )
    .bind(groupId, userId, tenantId)
    .first();

  if (existing) return json({ error: "already a member" }, { status: 409 });

  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO directory_memberships (id, tenant_id, group_id, user_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(newId, tenantId, groupId, userId, now)
    .run();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "group_member.added",
    targetType: "directory_membership",
    targetId: newId,
    detail: `${dirUser.email} added to ${group.name}`,
  });

  return json({ success: true, id: newId }, { status: 201 });
};

export const DELETE: RequestHandler = async ({
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

  const { id: groupId } = params;

  const body = await request.json().catch(() => null);
  if (!body?.userId)
    return json({ error: "userId is required" }, { status: 400 });

  const { userId } = body;

  // Verify membership exists
  const membership = await db
    .prepare(
      `SELECT m.id, u.email, g.name as group_name
       FROM directory_memberships m
       JOIN directory_users u ON u.id = m.user_id
       JOIN directory_groups g ON g.id = m.group_id
       WHERE m.group_id = ? AND m.user_id = ? AND m.tenant_id = ?`,
    )
    .bind(groupId, userId, tenantId)
    .first();

  if (!membership)
    return json({ error: "membership not found" }, { status: 404 });

  await db
    .prepare(
      `DELETE FROM directory_memberships WHERE group_id = ? AND user_id = ? AND tenant_id = ?`,
    )
    .bind(groupId, userId, tenantId)
    .run();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "group_member.removed",
    targetType: "directory_membership",
    targetId: membership.id,
    detail: `${membership.email} removed from ${membership.group_name}`,
  });

  return json({ success: true });
};
