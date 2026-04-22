import { json } from '@sveltejs/kit';
import { v as verifyPassword, h as hashPasswordPBKDF2 } from './password-DUgJgP1B.js';
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

const PATCH = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return json(
      { error: "Current and new passwords are required" },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }
  const row = await db.prepare(
    "SELECT id, password_hash, salt FROM console_users WHERE id = ? LIMIT 1"
  ).bind(user.userId).first();
  if (!row) {
    return json(
      { error: "User not found — password change not available" },
      { status: 404 }
    );
  }
  const valid = await verifyPassword(
    currentPassword,
    row.salt,
    row.password_hash
  );
  if (!valid) {
    return json({ error: "Current password is incorrect" }, { status: 400 });
  }
  const newHash = await hashPasswordPBKDF2(newPassword, row.salt);
  await db.prepare("UPDATE console_users SET password_hash = ? WHERE id = ?").bind(newHash, row.id).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "user.password_changed",
    targetType: "user",
    targetId: user.userId
  });
  return json({ success: true });
};

export { PATCH };
//# sourceMappingURL=_server.ts-DQxdhzb5.js.map
