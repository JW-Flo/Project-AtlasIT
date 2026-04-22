import { json } from '@sveltejs/kit';
import { a as requireSuperAdmin } from './guards-rSzq6XQW.js';
import { h as hashPasswordPBKDF2 } from './password-DUgJgP1B.js';
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

function generateTempPassword(length = 16) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}
const POST = async ({ request, locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const actor = locals.user;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  if (!email) return json({ error: "email required" }, { status: 400 });
  const row = await db.prepare("SELECT id, salt, tenant_id FROM console_users WHERE lower(email) = ?").bind(email).first();
  if (!row) return json({ error: "User not found" }, { status: 404 });
  const tempPassword = generateTempPassword();
  const newHash = await hashPasswordPBKDF2(tempPassword, row.salt);
  await db.prepare("UPDATE console_users SET password_hash = ? WHERE id = ?").bind(newHash, row.id).run();
  await writeAudit(db, {
    tenantId: row.tenant_id,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    action: "user.password_reset",
    targetType: "user",
    targetId: row.id
  });
  return json({ success: true, tempPassword });
};

export { POST };
//# sourceMappingURL=_server.ts-aJ31b2sN.js.map
