import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const user = locals.user!;
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body: Record<string, unknown> = await request.json().catch(() => ({}));
  const status = body.status as string | undefined;
  const tier = body.tier as string | undefined;

  if (!status && !tier) {
    return json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (status && !["active", "disabled"].includes(status)) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  if (tier && !["free", "starter", "professional", "enterprise"].includes(tier)) {
    return json({ error: "Invalid tier" }, { status: 400 });
  }

  if (status) {
    const disabledAt = status === "disabled" ? new Date().toISOString() : null;
    await db
      .prepare(`UPDATE tenants SET status = ?, disabled_at = ? WHERE id = ?`)
      .bind(status, disabledAt, params.id)
      .run();
  }

  if (tier) {
    await db
      .prepare(`UPDATE tenants SET tier = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(tier, params.id)
      .run();
  }

  await writeAudit(db, {
    tenantId: params.id!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: tier ? `tenant.tier.${tier}` : `tenant.${status}`,
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

  // Delete all tenant-scoped data before removing the tenant row.
  // Each delete is wrapped individually since some tables may not exist yet.
  const tenantScoped = [
    "audit_log",
    "automation_executions",
    "automation_rules",
    "compliance_evidence",
    "compliance_history",
    "compliance_scores",
    "console_user_roles",
    "console_users",
    "directory_groups",
    "directory_memberships",
    "directory_users",
    "group_app_mappings",
    "incidents",
    "access_reviews",
    "integrations",
    "app_credentials",
    "tenant_preferences",
    "tenant_billing",
    "tenant_compliance_packs",
    "mfa_totp_secrets",
    "sso_configurations",
    "sso_auth_state",
    "notifications",
  ];
  for (const table of tenantScoped) {
    try {
      await db.prepare(`DELETE FROM ${table} WHERE tenant_id = ?`).bind(params.id).run();
    } catch {
      // Table may not exist — skip
    }
  }

  // Also clean up users table (directory users) which may reference tenant
  try {
    await db.prepare(`DELETE FROM users WHERE tenant_id = ?`).bind(params.id).run();
  } catch {
    /* ignore */
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
