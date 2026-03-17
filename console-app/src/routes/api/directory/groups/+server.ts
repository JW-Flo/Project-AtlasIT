import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ groups: [] });

  const rows = await db
    .prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM directory_memberships WHERE group_id = g.id) as member_count
       FROM directory_groups g
       WHERE g.tenant_id = ?
       ORDER BY g.name ASC`,
    )
    .bind(tenantId)
    .all()
    .then((r: any) => r.results || []);

  return json({ groups: rows });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body?.name) return json({ error: "name is required" }, { status: 400 });

  const { name, description } = body;

  const newId = crypto.randomUUID();
  const externalId = `manual:${newId}`;
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO directory_groups (id, tenant_id, external_id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(newId, tenantId, externalId, name, description ?? null, now, now)
    .run();

  const created = await db
    .prepare(
      `SELECT id, external_id, name, description, created_at, updated_at FROM directory_groups WHERE id = ?`,
    )
    .bind(newId)
    .first();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "directory_group.created",
    targetType: "directory_group",
    targetId: newId,
    detail: name,
  });

  return json({ group: created }, { status: 201 });
};
