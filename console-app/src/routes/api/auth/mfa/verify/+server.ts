import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { verifyTotp, decryptTotpSecret, isEncryptedSecret } from "@atlasit/shared/crypto/totp";
import { verifyJwt } from "@atlasit/shared/crypto/jwt";
import { resolveSecurityPolicy, getSessionTtl } from "@atlasit/shared/security/policies";
import { queryPgOne } from "$lib/server/pg";
import { putSession } from "$lib/server/session-store";

export const POST: RequestHandler = async ({ request, cookies }) => {
  const encryptionKey = process.env.CRED_ENCRYPTION_KEY;
  const jwtSecret =
    process.env.JWT_SECRET || process.env.SESSION_SECRET || "atlasit-dev-jwt-secret";

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
    const tenantId = claims.tenantId as string;
    const totpRow = await queryPgOne<{ secret_encrypted: string }>(
      "SELECT secret_encrypted FROM mfa_totp_secrets WHERE user_id = $1 AND tenant_id = $2 AND verified = true",
      [userId, tenantId],
    );

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

    const rcRow = await queryPgOne<{ id: string }>(
      "SELECT id FROM mfa_recovery_codes WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL",
      [userId, codeHash],
    );

    if (rcRow) {
      await queryPgOne("UPDATE mfa_recovery_codes SET used_at = $1 WHERE id = $2", [
        new Date().toISOString(),
        rcRow.id,
      ]);
      verified = true;
    }
  }

  if (!verified) {
    return json({ error: "Invalid code" }, { status: 401 });
  }

  // Load tenant security policy for session TTL
  const secPolicy = await loadTenantSecurityPolicy(tenantId);
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

  await putSession(sid, user, sessionTtl);

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

async function loadTenantSecurityPolicy(tenantId: string) {
  try {
    const row = await queryPgOne<{ value: string }>(
      "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = $2",
      [tenantId, "security_policy"],
    );
    return resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
  } catch {
    return resolveSecurityPolicy(null);
  }
}
