import { json } from '@sveltejs/kit';
import { i as isEncryptedSecret, d as decryptTotpSecret, v as verifyTotp } from './totp-BDHpqMjI.js';
import { v as verifyJwt } from './jwt-pK30hwC6.js';
import { g as getSessionTtl, r as resolveSecurityPolicy } from './policies-DRfy6ccj.js';

const POST = async ({ request, platform, cookies }) => {
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;
  const encryptionKey = env.CRED_ENCRYPTION_KEY;
  const jwtSecret = env.JWT_SECRET || env.SESSION_SECRET || "atlasit-dev-jwt-secret";
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  if (!kv) return json({ error: "Session store unavailable" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const { mfaToken, code, recoveryCode } = body;
  if (!mfaToken) return json({ error: "MFA token required" }, { status: 400 });
  if (!code && !recoveryCode) return json({ error: "Code required" }, { status: 400 });
  const claims = await verifyJwt(mfaToken, jwtSecret);
  if (!claims || claims.aud !== "mfa-challenge") {
    return json({ error: "Invalid or expired MFA token. Please log in again." }, { status: 401 });
  }
  const userId = claims.sub;
  let verified = false;
  if (code) {
    const totpRow = await db.prepare("SELECT secret_encrypted FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1").bind(userId).first();
    if (!totpRow) {
      return json({ error: "TOTP not configured" }, { status: 400 });
    }
    let totpSecret = totpRow.secret_encrypted;
    if (encryptionKey && isEncryptedSecret(totpSecret)) {
      totpSecret = await decryptTotpSecret(totpSecret, encryptionKey);
    }
    const result = await verifyTotp(totpSecret, code);
    verified = result.valid;
  } else if (recoveryCode) {
    const normalizedCode = recoveryCode.toLowerCase().trim();
    const codeHash = await hashRecoveryCode(normalizedCode);
    const rcRow = await db.prepare(
      "SELECT id FROM mfa_recovery_codes WHERE user_id = ? AND code_hash = ? AND used_at IS NULL"
    ).bind(userId, codeHash).first();
    if (rcRow) {
      await db.prepare("UPDATE mfa_recovery_codes SET used_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), rcRow.id).run();
      verified = true;
    }
  }
  if (!verified) {
    return json({ error: "Invalid code" }, { status: 401 });
  }
  const tenantId = claims.tenantId;
  const secPolicy = await loadTenantSecurityPolicy(db, tenantId);
  const sessionTtl = getSessionTtl(secPolicy, true);
  const sid = crypto.randomUUID();
  const user = {
    userId,
    email: claims.email,
    displayName: claims.displayName,
    roles: claims.roles,
    superAdmin: claims.superAdmin,
    provider: "password",
    tenantId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    mfaVerified: true
  };
  await kv.put(sid, JSON.stringify(user), { expirationTtl: sessionTtl });
  cookies.set("atlas_session", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionTtl
  });
  return json({ success: true, email: user.email });
};
async function hashRecoveryCode(code) {
  const data = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function loadTenantSecurityPolicy(db, tenantId) {
  try {
    const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(tenantId, "security_policy").first();
    return resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
  } catch {
    return resolveSecurityPolicy(null);
  }
}

export { POST };
//# sourceMappingURL=_server.ts-DS0aNN-C.js.map
