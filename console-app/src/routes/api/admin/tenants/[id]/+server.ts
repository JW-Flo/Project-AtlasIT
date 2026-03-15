import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const PATCH: RequestHandler = async ({
  params,
  request,
  locals,
  platform,
}) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const user = locals.user!;
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}) as any);
  const status = body.status as string | undefined;
  if (!status || !["active", "disabled"].includes(status)) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  const disabledAt = status === "disabled" ? new Date().toISOString() : null;

  await db
    .prepare(`UPDATE tenants SET status = ?, disabled_at = ? WHERE id = ?`)
    .bind(status, disabledAt, params.id)
    .run();

  await writeAudit(db, {
    tenantId: params.id!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: `tenant.${status}`,
    targetType: "tenant",
    targetId: params.id,
  });

  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const user = locals.user!;
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  await db
    .prepare(`DELETE FROM console_users WHERE tenant_id = ?`)
    .bind(params.id)
    .run();

  await db.prepare(`DELETE FROM tenants WHERE id = ?`).bind(params.id).run();

  await writeAudit(db, {
    tenantId: params.id!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "tenant.deleted",
    targetType: "tenant",
    targetId: params.id,
  });

  return json({ success: true });
};
