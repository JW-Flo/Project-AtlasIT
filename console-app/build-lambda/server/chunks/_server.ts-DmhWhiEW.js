import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
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

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$100000$${hex}`;
}
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const { gateUserInvite } = await import('./tier-gate-z6sllkz2.js');
  const tierGate = await gateUserInvite(db, user.tenantId, !!user.superAdmin);
  if (tierGate) return tierGate;
  const body = await request.json().catch(() => ({}));
  const { email, displayName, role } = body;
  if (!email || !role || !["admin", "member"].includes(role)) {
    return json({ error: "email and role (admin|member) required" }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json({ error: "Invalid email format" }, { status: 400 });
  }
  const existing = await db.prepare(`SELECT id FROM console_users WHERE email = ? AND tenant_id = ?`).bind(email, user.tenantId).first();
  if (existing) {
    return json({ error: "User already exists in this tenant" }, { status: 409 });
  }
  const tempPassword = crypto.randomUUID().slice(0, 12);
  const salt = crypto.randomUUID();
  const passwordHash = await hashPassword(tempPassword, salt);
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    email,
    passwordHash,
    salt,
    displayName ?? null,
    JSON.stringify([role]),
    user.tenantId,
    now
  ).run();
  const directoryUserId = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, status, source, console_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    directoryUserId,
    user.tenantId,
    "local:" + id,
    email,
    displayName ?? email,
    "active",
    "local",
    id,
    now,
    now
  ).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "user.invited",
    targetType: "user",
    targetId: id,
    detail: JSON.stringify({ email, role })
  });
  try {
    const { sendInviteEmail } = await import('./email-BNV8ODsA.js');
    const tenant = await db.prepare("SELECT name FROM tenants WHERE id = ?").bind(user.tenantId).first();
    await sendInviteEmail(platform, {
      email,
      tempPassword,
      inviterName: user.displayName || user.email,
      orgName: tenant?.name || "your organization",
      loginUrl: `${request.headers.get("origin") || "https://www.atlasit.pro"}/console/login`
    });
  } catch (err) {
    console.warn("Invite email send failed (non-blocking):", err);
  }
  return json({ success: true });
};

export { POST };
//# sourceMappingURL=_server.ts-DmhWhiEW.js.map
