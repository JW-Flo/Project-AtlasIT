import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const PATCH: RequestHandler = async ({
  params,
  request,
  locals,
  platform,
}) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  const mappingId = params.id;

  const existing = await db
    .prepare(`SELECT * FROM group_app_mappings WHERE id = ? AND tenant_id = ?`)
    .bind(mappingId, tenantId)
    .first();

  if (!existing) {
    return json({ error: "mapping not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updates: string[] = ["updated_at = ?"];
  const binds: any[] = [now];

  if (body.role !== undefined) {
    updates.push("role = ?");
    binds.push(body.role);
  }

  if (body.confirmed === true) {
    updates.push("suggested = 0");
  }

  binds.push(mappingId, tenantId);

  await db
    .prepare(
      `UPDATE group_app_mappings SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`,
    )
    .bind(...binds)
    .run();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mapping.update",
    targetType: "group_app_mapping",
    targetId: mappingId!,
    detail: JSON.stringify(body),
  });

  const updated = await db
    .prepare(`SELECT * FROM group_app_mappings WHERE id = ?`)
    .bind(mappingId)
    .first();

  return json({ mapping: updated });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  const mappingId = params.id;

  const existing = await db
    .prepare(`SELECT * FROM group_app_mappings WHERE id = ? AND tenant_id = ?`)
    .bind(mappingId, tenantId)
    .first();

  if (!existing) {
    return json({ error: "mapping not found" }, { status: 404 });
  }

  await db
    .prepare(`DELETE FROM group_app_mappings WHERE id = ? AND tenant_id = ?`)
    .bind(mappingId, tenantId)
    .run();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mapping.delete",
    targetType: "group_app_mapping",
    targetId: mappingId!,
    detail: JSON.stringify({
      groupId: existing.group_id,
      appId: existing.app_id,
    }),
  });

  return json({ success: true });
};
