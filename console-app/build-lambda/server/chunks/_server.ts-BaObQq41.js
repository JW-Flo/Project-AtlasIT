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
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  const encryptionKey = env.CRED_ENCRYPTION_KEY;
  const body = await request.json().catch(() => ({}));
  const { code } = body;
  if (!code) return json({ error: "Code required" }, { status: 400 });
  const row = await db.prepare("SELECT secret_encrypted, verified FROM mfa_totp_secrets WHERE user_id = ?").bind(user.userId).first();
  if (!row) return json({ error: "No TOTP setup in progress" }, { status: 404 });
  if (row.verified) return json({ error: "TOTP already verified" }, { status: 409 });
  let totpSecret = row.secret_encrypted;
  if (encryptionKey && isEncryptedSecret(totpSecret)) {
    totpSecret = await decryptTotpSecret(totpSecret, encryptionKey);
  }
  const result = await verifyTotp(totpSecret, code);
  if (!result.valid) {
    return json(
      { error: "Invalid code. Check your authenticator app and try again." },
      { status: 401 }
    );
  }
  await db.prepare("UPDATE mfa_totp_secrets SET verified = 1, enabled_at = ? WHERE user_id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), user.userId).run();
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mfa.totp_enabled",
    targetType: "user",
    targetId: user.userId
  });
  return json({ success: true });
};

export { POST };
//# sourceMappingURL=_server.ts-BaObQq41.js.map
