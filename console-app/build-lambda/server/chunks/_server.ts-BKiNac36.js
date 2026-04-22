import { json } from '@sveltejs/kit';
import { i as isEncryptedSecret, d as decryptTotpSecret, v as verifyTotp } from './totp-BDHpqMjI.js';
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

const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  const encryptionKey = env.CRED_ENCRYPTION_KEY;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const { code } = body;
  if (!code) return json({ error: "TOTP code required to disable MFA" }, { status: 400 });
  const totpRow = await db.prepare("SELECT secret_encrypted FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1").bind(user.userId).first();
  if (!totpRow) return json({ error: "MFA is not enrolled" }, { status: 400 });
  let totpSecret = totpRow.secret_encrypted;
  if (encryptionKey && isEncryptedSecret(totpSecret)) {
    totpSecret = await decryptTotpSecret(totpSecret, encryptionKey);
  }
  const result = await verifyTotp(totpSecret, code);
  if (!result.valid) return json({ error: "Invalid code" }, { status: 401 });
  await db.prepare("DELETE FROM mfa_totp_secrets WHERE user_id = ?").bind(user.userId).run();
  await db.prepare("DELETE FROM mfa_recovery_codes WHERE user_id = ?").bind(user.userId).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mfa.totp_disabled",
    targetType: "user",
    targetId: user.userId
  });
  return json({ success: true });
};

export { POST };
//# sourceMappingURL=_server.ts-BKiNac36.js.map
