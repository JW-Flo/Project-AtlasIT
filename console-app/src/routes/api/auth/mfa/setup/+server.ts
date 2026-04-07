import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  generateTotpSecret,
  generateTotpUri,
  generateRecoveryCodes,
  encryptTotpSecret,
} from "@atlasit/shared/crypto/totp";

/** Start TOTP enrollment — generates secret + recovery codes, stores encrypted. */
export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  // C-3 FIX: Require encryption key for TOTP secret storage
  const encryptionKey: string | undefined = env.CRED_ENCRYPTION_KEY;
  if (!encryptionKey) {
    return json({ error: "MFA encryption not configured" }, { status: 503 });
  }

  // Check if already enabled
  const existing = await db
    .prepare("SELECT verified FROM mfa_totp_secrets WHERE user_id = ?")
    .bind(user.userId)
    .first<{ verified: number }>();

  if (existing?.verified) {
    return json({ error: "TOTP already enabled. Disable it first to re-enroll." }, { status: 409 });
  }

  const secret = generateTotpSecret();
  const uri = generateTotpUri(secret, user.email, "AtlasIT");
  const recoveryCodes = generateRecoveryCodes(8);

  // Hash recovery codes for storage
  const codeHashes = await Promise.all(recoveryCodes.map((c) => hashCode(c)));

  // C-3 FIX: Encrypt secret before storing in D1
  const encryptedSecret = await encryptTotpSecret(secret, encryptionKey);

  // Upsert the unverified secret
  if (existing) {
    await db
      .prepare(
        "UPDATE mfa_totp_secrets SET secret_encrypted = ?, verified = 0, enabled_at = NULL WHERE user_id = ?",
      )
      .bind(encryptedSecret, user.userId)
      .run();
  } else {
    await db
      .prepare(
        "INSERT INTO mfa_totp_secrets (user_id, tenant_id, secret_encrypted, verified) VALUES (?, ?, ?, 0)",
      )
      .bind(user.userId, user.tenantId, encryptedSecret)
      .run();
  }

  // Replace any existing recovery codes
  await db.prepare("DELETE FROM mfa_recovery_codes WHERE user_id = ?").bind(user.userId).run();

  for (let i = 0; i < recoveryCodes.length; i++) {
    await db
      .prepare("INSERT INTO mfa_recovery_codes (id, user_id, code_hash) VALUES (?, ?, ?)")
      .bind(crypto.randomUUID(), user.userId, codeHashes[i])
      .run();
  }

  return json({ secret, uri, recoveryCodes });
};

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
