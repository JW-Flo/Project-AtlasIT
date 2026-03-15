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
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { roles } = body as { roles?: string[] };

  if (!roles || !Array.isArray(roles)) {
    return json({ error: "roles array required" }, { status: 400 });
  }

  // Prevent removing last owner
  if (!roles.includes("owner")) {
    const target = await db
      .prepare(`SELECT roles FROM console_users WHERE id = ? AND tenant_id = ?`)
      .bind(params.id, user!.tenantId)
      .first();

    if (target) {
      const targetRoles: string[] = JSON.parse(target.roles as string);
      if (targetRoles.includes("owner")) {
        const ownerCount = await db
          .prepare(
            `SELECT COUNT(*) as cnt FROM console_users WHERE tenant_id = ? AND roles LIKE '%owner%'`,
          )
          .bind(user!.tenantId)
          .first();

        if (ownerCount && (ownerCount.cnt as number) <= 1) {
          return json(
            { error: "Cannot remove the last owner" },
            { status: 400 },
          );
        }
      }
    }
  }

  await db
    .prepare(
      `UPDATE console_users SET roles = ? WHERE id = ? AND tenant_id = ?`,
    )
    .bind(JSON.stringify(roles), params.id, user!.tenantId)
    .run();

  await writeAudit(db, {
    tenantId: user!.tenantId!,
    actorUserId: user!.userId,
    actorEmail: user!.email,
    action: "user.roles_updated",
    targetType: "user",
    targetId: params.id,
    detail: JSON.stringify({ roles }),
  });

  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  if (params.id === user!.userId) {
    return json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  // Prevent removing last owner
  const target = await db
    .prepare(`SELECT roles FROM console_users WHERE id = ? AND tenant_id = ?`)
    .bind(params.id, user!.tenantId)
    .first();

  if (!target) {
    return json({ error: "User not found" }, { status: 404 });
  }

  const targetRoles: string[] = JSON.parse(target.roles as string);
  if (targetRoles.includes("owner")) {
    const ownerCount = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM console_users WHERE tenant_id = ? AND roles LIKE '%owner%'`,
      )
      .bind(user!.tenantId)
      .first();

    if (ownerCount && (ownerCount.cnt as number) <= 1) {
      return json({ error: "Cannot remove the last owner" }, { status: 400 });
    }
  }

  await db
    .prepare(`DELETE FROM console_users WHERE id = ? AND tenant_id = ?`)
    .bind(params.id, user!.tenantId)
    .run();

  await writeAudit(db, {
    tenantId: user!.tenantId!,
    actorUserId: user!.userId,
    actorEmail: user!.email,
    action: "user.deleted",
    targetType: "user",
    targetId: params.id,
  });

  return json({ success: true });
};
