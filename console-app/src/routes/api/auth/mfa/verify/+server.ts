import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { verifyTotp, decryptTotpSecret, isEncryptedSecret } from "@atlasit/shared/crypto/totp";
import { verifyJwt } from "@atlasit/shared/crypto/jwt";
import { resolveSecurityPolicy, getSessionTtl } from "@atlasit/shared/security/policies";

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;
  const encryptionKey: string | undefined = env.CRED_ENCRYPTION_KEY;
  const jwtSecret = env.JWT_SECRET || env.SESSION_SECRET || "atlasit-dev-jwt-secret";

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

  // Verify the JWT challenge token
  const claims = await verifyJwt(mfaToken, jwtSecret);
  if (!claims || claims.aud !== "mfa-challenge") {
    return json({ error: "Invalid or expired MFA token. Please log in again." }, { status: 401 });
  }

  const userId = claims.sub;
  let verified = false;

  if (code) {
    // TOTP verification
    const totpRow = await db
      .prepare("SELECT secret_encrypted FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1")
      .bind(userId)
      .first<{ secret_encrypted: string }>();

    if (!totpRow) {
      return json({ error: "TOTP not configured" }, { status: 400 });
    }

    // C-3 FIX: Decrypt secret before verification; support legacy plaintext
    let totpSecret = totpRow.secret_encrypted;
    if (encryptionKey && isEncryptedSecret(totpSecret)) {
      totpSecret = await decryptTotpSecret(totpSecret, encryptionKey);
    }

    const result = await verifyTotp(totpSecret, code);
    verified = result.valid;
  } else if (recoveryCode) {
    // Recovery code verification
    const normalizedCode = recoveryCode.toLowerCase().trim();
    const codeHash = await hashRecoveryCode(normalizedCode);

    const rcRow = await db
      .prepare(
        "SELECT id FROM mfa_recovery_codes WHERE user_id = ? AND code_hash = ? AND used_at IS NULL",
      )
      .bind(userId, codeHash)
      .first<{ id: string }>();

    if (rcRow) {
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

  // Load tenant security policy for session TTL
  const tenantId = claims.tenantId as string;
  const secPolicy = await loadTenantSecurityPolicy(db, tenantId);
  const sessionTtl = getSessionTtl(secPolicy, true); // MFA-verified session

  // Create session with MFA-verified flag
  const sid = crypto.randomUUID();
  const user = {
    userId,
    email: claims.email,
    displayName: claims.displayName,
    roles: claims.roles,
    superAdmin: claims.superAdmin,
    provider: "password",
    tenantId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    mfaVerified: true,
  };

  await kv.put(sid, JSON.stringify(user), { expirationTtl: sessionTtl });

  cookies.set("atlas_session", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionTtl,
  });

  return json({ success: true, email: user.email });
};

async function hashRecoveryCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function loadTenantSecurityPolicy(db: any, tenantId: string) {
  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?")
      .bind(tenantId, "security_policy")
      .first<{ value: string }>();
    return resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
  } catch {
    return resolveSecurityPolicy(null);
  }
}
