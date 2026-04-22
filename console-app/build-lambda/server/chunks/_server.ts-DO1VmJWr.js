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

const POST = async ({
  params,
  cookies,
  locals,
  platform
}) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const user = locals.user;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;
  if (!db || !kv)
    return json({ error: "Service unavailable" }, { status: 500 });
  const owner = await db.prepare(
    `SELECT * FROM console_users WHERE tenant_id = ? AND roles LIKE '%owner%' LIMIT 1`
  ).bind(params.id).first();
  if (!owner) {
    return json({ error: "Tenant owner not found" }, { status: 404 });
  }
  const currentSessionId = cookies.get("atlas_session") ?? "";
  const roles = JSON.parse(owner.roles);
  const sessionData = {
    userId: owner.id,
    email: owner.email,
    roles,
    superAdmin: false,
    provider: "impersonation",
    tenantId: params.id,
    displayName: owner.display_name ?? owner.email,
    createdAt: owner.created_at,
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    impersonating: true,
    impersonatedBy: user.email,
    originalSessionId: currentSessionId
  };
  const newSessionId = crypto.randomUUID();
  await kv.put(newSessionId, JSON.stringify(sessionData), {
    expirationTtl: 900
  });
  cookies.set("atlas_session", newSessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 900
  });
  cookies.set("atlas_session_cache", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  await writeAudit(db, {
    tenantId: params.id,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "tenant.impersonate",
    targetType: "user",
    targetId: owner.id
  });
  return json({ success: true });
};

export { POST };
//# sourceMappingURL=_server.ts-DO1VmJWr.js.map
