import { json } from '@sveltejs/kit';
import { a as requireSuperAdmin } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const PATCH = async ({ params, request, locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const user = locals.user;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const status = body.status;
  const tier = body.tier;
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
    const disabledAt = status === "disabled" ? (/* @__PURE__ */ new Date()).toISOString() : null;
    await db.prepare(`UPDATE tenants SET status = ?, disabled_at = ? WHERE id = ?`).bind(status, disabledAt, params.id).run();
  }
  if (tier) {
    await db.prepare(`UPDATE tenants SET tier = ?, updated_at = datetime('now') WHERE id = ?`).bind(tier, params.id).run();
  }
  await writeAudit(db, {
    tenantId: params.id,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: tier ? `tenant.tier.${tier}` : `tenant.${status}`,
    targetType: "tenant",
    targetId: params.id
  });
  return json({ success: true });
};
const DELETE = async ({ params, locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const user = locals.user;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
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
    "notifications"
  ];
  for (const table of tenantScoped) {
    try {
      await db.prepare(`DELETE FROM ${table} WHERE tenant_id = ?`).bind(params.id).run();
    } catch {
    }
  }
  try {
    await db.prepare(`DELETE FROM users WHERE tenant_id = ?`).bind(params.id).run();
  } catch {
  }
  await db.prepare(`DELETE FROM tenants WHERE id = ?`).bind(params.id).run();
  await writeAudit(db, {
    tenantId: params.id,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "tenant.deleted",
    targetType: "tenant",
    targetId: params.id
  });
  return json({ success: true });
};

export { DELETE, PATCH };
//# sourceMappingURL=_server.ts-Ss6odhVM.js.map
