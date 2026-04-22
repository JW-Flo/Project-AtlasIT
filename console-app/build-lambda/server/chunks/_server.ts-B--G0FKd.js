import { json } from '@sveltejs/kit';
import { g as generateTotpSecret, a as generateTotpUri, b as generateRecoveryCodes, e as encryptTotpSecret } from './totp-BDHpqMjI.js';

const POST = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  const encryptionKey = env.CRED_ENCRYPTION_KEY;
  if (!encryptionKey) {
    return json({ error: "MFA encryption not configured" }, { status: 503 });
  }
  const existing = await db.prepare("SELECT verified FROM mfa_totp_secrets WHERE user_id = ?").bind(user.userId).first();
  if (existing?.verified) {
    return json({ error: "TOTP already enabled. Disable it first to re-enroll." }, { status: 409 });
  }
  const secret = generateTotpSecret();
  const uri = generateTotpUri(secret, user.email, "AtlasIT");
  const recoveryCodes = generateRecoveryCodes(8);
  const codeHashes = await Promise.all(recoveryCodes.map((c) => hashCode(c)));
  const encryptedSecret = await encryptTotpSecret(secret, encryptionKey);
  if (existing) {
    await db.prepare(
      "UPDATE mfa_totp_secrets SET secret_encrypted = ?, verified = 0, enabled_at = NULL WHERE user_id = ?"
    ).bind(encryptedSecret, user.userId).run();
  } else {
    await db.prepare(
      "INSERT INTO mfa_totp_secrets (user_id, tenant_id, secret_encrypted, verified) VALUES (?, ?, ?, 0)"
    ).bind(user.userId, user.tenantId, encryptedSecret).run();
  }
  await db.prepare("DELETE FROM mfa_recovery_codes WHERE user_id = ?").bind(user.userId).run();
  for (let i = 0; i < recoveryCodes.length; i++) {
    await db.prepare("INSERT INTO mfa_recovery_codes (id, user_id, code_hash) VALUES (?, ?, ?)").bind(crypto.randomUUID(), user.userId, codeHashes[i]).run();
  }
  return json({ secret, uri, recoveryCodes });
};
async function hashCode(code) {
  const data = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export { POST };
//# sourceMappingURL=_server.ts-B--G0FKd.js.map
