import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { hashPasswordPBKDF2, verifyPassword } from "$lib/server/password";
import { signJwt } from "@atlasit/shared/crypto/jwt";
import {
  resolveSecurityPolicy,
  isMfaRequiredForUser,
  getSessionTtl,
} from "@atlasit/shared/security/policies";

const MFA_CHALLENGE_TTL = 300; // 5 minutes

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const env = (platform?.env as any) || {};
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return json({ error: "Email and password required" }, { status: 400 });
  }

  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;
  const jwtSecret = env.JWT_SECRET || env.SESSION_SECRET;
  if (!jwtSecret) {
    // Fail-fast: never use a default secret. In dev, set JWT_SECRET in .dev.vars.
    console.error(
      JSON.stringify({
        level: "error",
        event: "auth.missing_jwt_secret",
        message: "JWT_SECRET or SESSION_SECRET must be configured",
      }),
    );
    return json({ error: "Authentication service misconfigured" }, { status: 503 });
  }

  if (!db) {
    // Fallback: allow super admin login only when ADMIN_PASSWORD is explicitly configured
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
    }
    return json({ error: "Invalid credentials" }, { status: 401 });
  }

  // D1-backed auth — table created via migration 0048_console_users.sql
  try {
    const row = await db
      .prepare("SELECT * FROM console_users WHERE email = ? COLLATE NOCASE LIMIT 1")
      .bind(email.toLowerCase())
      .first<{
        id: string;
        email: string;
        password_hash: string;
        salt: string;
        display_name: string | null;
        roles: string;
        tenant_id: string;
      }>();

    if (!row) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, row.salt, row.password_hash);
    if (!valid) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    // If the stored hash is a legacy SHA-256, re-hash with PBKDF2 transparently
    if (!row.password_hash.startsWith("pbkdf2$")) {
      const newHash = await hashPasswordPBKDF2(password, row.salt);
      await db
        .prepare("UPDATE console_users SET password_hash = ? WHERE id = ?")
        .bind(newHash, row.id)
        .run();
    }

    // Update last login
    await db
      .prepare("UPDATE console_users SET last_login = ? WHERE id = ?")
      .bind(new Date().toISOString(), row.id)
      .run();

    let roles: string[];
    try {
      roles = JSON.parse(row.roles || '["admin"]');
      if (!Array.isArray(roles)) roles = ["admin"];
    } catch {
      roles = ["admin"];
    }

    const isSuperAdmin =
      roles.includes("super-admin") ||
      row.email.toLowerCase() === (env.SUPER_ADMIN_EMAIL || "").toLowerCase();

    if (isSuperAdmin) {
      if (!roles.includes("super-admin")) roles.push("super-admin");
      if (!roles.includes("owner")) roles.push("owner");
    }

    // Load tenant security policy
    const secPolicy = await loadTenantSecurityPolicy(db, row.tenant_id);

    // Check if user has MFA enrolled
    const mfaRow = await db
      .prepare("SELECT verified FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1")
      .bind(row.id)
      .first();

    const hasMfaEnrolled = !!mfaRow;
    const mfaRequiredByPolicy = isMfaRequiredForUser(secPolicy, roles);

    if (hasMfaEnrolled) {
      // User has TOTP — issue a JWT challenge token
      const now = Math.floor(Date.now() / 1000);
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
          tenantId: row.tenant_id,
        },
        jwtSecret,
      );

      return json({ mfaRequired: true, mfaToken: challengeJwt });
    }

    if (mfaRequiredByPolicy && !hasMfaEnrolled) {
      // Tenant policy requires MFA but user hasn't enrolled — force setup
      // Create a temporary session that can only access MFA setup
      if (!kv) return json({ error: "Session store unavailable" }, { status: 503 });

      const sessionTtl = 900; // 15 min for MFA setup
      const sid = crypto.randomUUID();
      const user = {
        userId: row.id,
        email: row.email,
        displayName: row.display_name,
        roles,
        superAdmin: isSuperAdmin,
        provider: "password",
        tenantId: row.tenant_id,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        mfaSetupRequired: true,
      };

      await kv.put(sid, JSON.stringify(user), { expirationTtl: sessionTtl });
      cookies.set("atlas_session", sid, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: sessionTtl,
      });

      return json({ success: true, email: user.email, mfaSetupRequired: true });
    }

    // No MFA needed — create full session with policy-based TTL
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
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      mfaVerified: false,
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
  } catch (e: any) {
    console.error("Login error:", e);
    return json({ error: "Authentication service error" }, { status: 500 });
  }
};

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
