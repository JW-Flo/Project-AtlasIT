import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { verifyTotp } from "@atlasit/shared/crypto/totp";
import { hashPasswordPBKDF2 } from "$lib/server/password";

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;

  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  if (!kv) return json({ error: "Session store unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { mfaToken, code, recoveryCode } = body as {
    mfaToken?: string;
    code?: string;
    recoveryCode?: string;
  };

  if (!mfaToken) return json({ error: "MFA token required" }, { status: 400 });
  if (!code && !recoveryCode) return json({ error: "Code required" }, { status: 400 });

  // Look up the challenge
  const challenge = await db
    .prepare("SELECT * FROM mfa_challenges WHERE token = ?")
    .bind(mfaToken)
    .first<{
      token: string;
      user_id: string;
      tenant_id: string;
      user_email: string;
      user_data: string;
      expires_at: string;
    }>();

  if (!challenge) return json({ error: "Invalid or expired MFA token" }, { status: 401 });

  // Check expiry
  if (new Date(challenge.expires_at) < new Date()) {
    await db.prepare("DELETE FROM mfa_challenges WHERE token = ?").bind(mfaToken).run();
    return json({ error: "MFA token expired, please log in again" }, { status: 401 });
  }

  let verified = false;

  if (code) {
    // TOTP verification
    const totpRow = await db
      .prepare("SELECT secret_encrypted FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1")
      .bind(challenge.user_id)
      .first<{ secret_encrypted: string }>();

    if (!totpRow) {
      return json({ error: "TOTP not configured" }, { status: 400 });
    }

    // secret_encrypted is the base32 secret (encrypted at rest in production via env key)
    const result = await verifyTotp(totpRow.secret_encrypted, code);
    verified = result.valid;
  } else if (recoveryCode) {
    // Recovery code verification
    const normalizedCode = recoveryCode.toLowerCase().trim();
    // Hash the recovery code the same way we stored it
    const codeHash = await hashRecoveryCode(normalizedCode);

    const rcRow = await db
      .prepare(
        "SELECT id FROM mfa_recovery_codes WHERE user_id = ? AND code_hash = ? AND used_at IS NULL",
      )
      .bind(challenge.user_id, codeHash)
      .first<{ id: string }>();

    if (rcRow) {
      // Mark as used
      await db
        .prepare("UPDATE mfa_recovery_codes SET used_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), rcRow.id)
        .run();
      verified = true;
    }
  }

  if (!verified) {
    return json({ error: "Invalid code" }, { status: 401 });
  }

  // Delete the challenge
  await db.prepare("DELETE FROM mfa_challenges WHERE token = ?").bind(mfaToken).run();

  // Clean up expired challenges periodically (best-effort)
  db.prepare("DELETE FROM mfa_challenges WHERE expires_at < ?")
    .bind(new Date().toISOString())
    .run()
    .catch(() => {});

  // Create session
  const userData = JSON.parse(challenge.user_data);
  const sid = crypto.randomUUID();
  const user = {
    ...userData,
    provider: "password",
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  await kv.put(sid, JSON.stringify(user), { expirationTtl: 604800 });

  cookies.set("atlas_session", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });

  return json({ success: true, email: user.email });
};

async function hashRecoveryCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
