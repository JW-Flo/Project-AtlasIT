import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { r as resolveSecurityPolicy } from './policies-DRfy6ccj.js';
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

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ policy: resolveSecurityPolicy(null) });
  try {
    const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(user.tenantId, "security_policy").first();
    const policy = resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
    return json({ policy });
  } catch (e) {
    console.error("Security policy load error:", e);
    return json({ policy: resolveSecurityPolicy(null) });
  }
};
const PUT = async ({ request, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const updates = body;
  if (updates.sessionTtlSeconds !== void 0) {
    if (updates.sessionTtlSeconds < 900 || updates.sessionTtlSeconds > 2592e3) {
      return json({ error: "Session TTL must be between 15 minutes and 30 days" }, { status: 400 });
    }
  }
  if (updates.mfaSessionTtlSeconds !== void 0) {
    if (updates.mfaSessionTtlSeconds < 900 || updates.mfaSessionTtlSeconds > 7776e3) {
      return json(
        { error: "MFA session TTL must be between 15 minutes and 90 days" },
        { status: 400 }
      );
    }
  }
  if (updates.idleTimeoutSeconds !== void 0) {
    if (updates.idleTimeoutSeconds < 300 || updates.idleTimeoutSeconds > 604800) {
      return json({ error: "Idle timeout must be between 5 minutes and 7 days" }, { status: 400 });
    }
  }
  if (updates.minPasswordLength !== void 0) {
    if (updates.minPasswordLength < 8 || updates.minPasswordLength > 128) {
      return json({ error: "Min password length must be between 8 and 128" }, { status: 400 });
    }
  }
  try {
    const existing = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(user.tenantId, "security_policy").first();
    const current = existing ? JSON.parse(existing.value) : {};
    const merged = resolveSecurityPolicy({ ...current, ...updates });
    const mergedJson = JSON.stringify(merged);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.prepare(
      `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(tenant_id, key) DO UPDATE SET value = ?, updated_at = ?`
    ).bind(user.tenantId, "security_policy", mergedJson, now, mergedJson, now).run();
    await writeAudit(db, {
      tenantId: user.tenantId,
      actorUserId: user.userId,
      actorEmail: user.email,
      action: "security_policy.updated",
      targetType: "tenant",
      targetId: user.tenantId,
      detail: JSON.stringify(updates)
    });
    return json({ policy: merged });
  } catch (e) {
    console.error("Security policy save error:", e);
    const detail = e?.message || String(e);
    return json({ error: `Failed to save security policy: ${detail}` }, { status: 500 });
  }
};

export { GET, PUT };
//# sourceMappingURL=_server.ts-CMoujAaN.js.map
