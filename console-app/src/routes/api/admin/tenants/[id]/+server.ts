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

  const body: Record<string, unknown> = await request.json().catch(() => ({}));
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

  // Delete all tenant-scoped data before removing the tenant row
  const tenantScoped = [
    "audit_log",
    "automation_executions",
    "automation_rules",
    "compliance_evidence",
    "compliance_scores",
    "console_user_roles",
    "console_users",
    "directory_groups",
    "directory_memberships",
    "directory_users",
    "group_app_mappings",
    "integrations",
    "tenant_preferences",
  ];
  for (const table of tenantScoped) {
    await db
      .prepare(`DELETE FROM ${table} WHERE tenant_id = ?`)
      .bind(params.id)
      .run();
  }

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
