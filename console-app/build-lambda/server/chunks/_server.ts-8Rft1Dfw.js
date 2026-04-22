import { json } from '@sveltejs/kit';
import { v as verifyPassword, h as hashPasswordPBKDF2 } from './password-DUgJgP1B.js';
import { s as signJwt } from './jwt-pK30hwC6.js';
import { i as isMfaRequiredForUser, g as getSessionTtl, r as resolveSecurityPolicy } from './policies-DRfy6ccj.js';
import { r as resolveDemoTenantConfig, a as resetDemoTenant } from './demoTenant-CWyzajKa.js';

const MFA_CHALLENGE_TTL = 300;
const POST = async ({ request, platform, cookies }) => {
  const env = platform?.env || {};
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;
  if (!email || !password) {
    return json({ error: "Email and password required" }, { status: 400 });
  }
  const db = env.ATLAS_SHARED_DB;
  const demoMode = String(env.DEMO_MODE ?? "false").toLowerCase() === "true";
  const demoConfig = resolveDemoTenantConfig(env);
  const kv = env.KV_SESSIONS;
  const jwtSecret = env.JWT_SECRET || env.SESSION_SECRET;
  if (!jwtSecret) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "auth.missing_jwt_secret",
        message: "JWT_SECRET or SESSION_SECRET must be configured"
      })
    );
    return json({ error: "Authentication service misconfigured" }, { status: 503 });
  }
  if (demoMode && demoConfig && email.toLowerCase() === demoConfig.email && password === demoConfig.password && db) {
    try {
      await resetDemoTenant(db, demoConfig);
    } catch {
    }
  }
  if (!db) {
    const superEmail = (env.SUPER_ADMIN_EMAIL || "").toLowerCase();
    const superPass = env.ADMIN_PASSWORD;
    if (!superPass) {
      return json({ error: "Authentication service unavailable" }, { status: 503 });
    }
    if (email.toLowerCase() === superEmail && password === superPass) {
      if (!kv) {
        return json({ error: "Session store unavailable" }, { status: 503 });
      }
      const sid = crypto.randomUUID();
      const user = {
        userId: email.toLowerCase(),
        email: email.toLowerCase(),
        roles: ["super-admin"],
        superAdmin: true,
        provider: "password",
        tenantId: env.DEFAULT_TENANT_ID || "default",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await kv.put(sid, JSON.stringify(user), { expirationTtl: 604800 });
      cookies.set("atlas_session", sid, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 604800
      });
      return json({ success: true, email: user.email });
    }
    return json({ error: "Invalid credentials" }, { status: 401 });
  }
  try {
    const row = await db.prepare("SELECT * FROM console_users WHERE email = ? COLLATE NOCASE LIMIT 1").bind(email.toLowerCase()).first();
    if (!row) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }
    const valid = await verifyPassword(password, row.salt, row.password_hash);
    if (!valid) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (!row.password_hash.startsWith("pbkdf2$")) {
      const newHash = await hashPasswordPBKDF2(password, row.salt);
      await db.prepare("UPDATE console_users SET password_hash = ? WHERE id = ?").bind(newHash, row.id).run();
    }
    await db.prepare("UPDATE console_users SET last_login = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), row.id).run();
    let roles;
    try {
      roles = JSON.parse(row.roles || '["admin"]');
      if (!Array.isArray(roles)) roles = ["admin"];
    } catch {
      roles = ["admin"];
    }
    const isSuperAdmin = roles.includes("super-admin") || row.email.toLowerCase() === (env.SUPER_ADMIN_EMAIL || "").toLowerCase();
    if (isSuperAdmin) {
      if (!roles.includes("super-admin")) roles.push("super-admin");
      if (!roles.includes("owner")) roles.push("owner");
    }
    const secPolicy = await loadTenantSecurityPolicy(db, row.tenant_id);
    const mfaRow = await db.prepare("SELECT verified FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1").bind(row.id).first();
    const hasMfaEnrolled = !!mfaRow;
    const mfaRequiredByPolicy = isMfaRequiredForUser(secPolicy, roles);
    if (hasMfaEnrolled) {
      const now = Math.floor(Date.now() / 1e3);
      const challengeJwt = await signJwt(
        {
          sub: row.id,
          iss: "atlasit",
          aud: "mfa-challenge",
          iat: now,
          exp: now + MFA_CHALLENGE_TTL,
          email: row.email,
          displayName: row.display_name,
          roles,
          superAdmin: isSuperAdmin,
          tenantId: row.tenant_id
        },
        jwtSecret
      );
      return json({ mfaRequired: true, mfaToken: challengeJwt });
    }
    if (mfaRequiredByPolicy && !hasMfaEnrolled) {
      if (!kv) return json({ error: "Session store unavailable" }, { status: 503 });
      const sessionTtl2 = 900;
      const sid2 = crypto.randomUUID();
      const user2 = {
        userId: row.id,
        email: row.email,
        displayName: row.display_name,
        roles,
        superAdmin: isSuperAdmin,
        provider: "password",
        tenantId: row.tenant_id,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
        mfaSetupRequired: true
      };
      await kv.put(sid2, JSON.stringify(user2), { expirationTtl: sessionTtl2 });
      cookies.set("atlas_session", sid2, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: sessionTtl2
      });
      return json({ success: true, email: user2.email, mfaSetupRequired: true });
    }
    if (!kv) {
      return json({ error: "Session store unavailable" }, { status: 503 });
    }
    const sessionTtl = getSessionTtl(secPolicy, false);
    const sid = crypto.randomUUID();
    const user = {
      userId: row.id,
      email: row.email,
      displayName: row.display_name,
      roles,
      superAdmin: isSuperAdmin,
      provider: "password",
      tenantId: row.tenant_id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      mfaVerified: false
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
  } catch (e) {
    console.error("Login error:", e);
    return json({ error: "Authentication service error" }, { status: 500 });
  }
};
async function loadTenantSecurityPolicy(db, tenantId) {
  try {
    const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(tenantId, "security_policy").first();
    return resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
  } catch {
    return resolveSecurityPolicy(null);
  }
}

export { POST };
//# sourceMappingURL=_server.ts-8Rft1Dfw.js.map
