import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { hashPasswordPBKDF2, verifyPassword } from "$lib/server/password";
import { signJwt } from "@atlasit/shared/crypto/jwt";
import {
  resolveSecurityPolicy,
  isMfaRequiredForUser,
  getSessionTtl,
} from "@atlasit/shared/security/policies";
import { resolveDemoTenantConfig, resetDemoTenant } from "$lib/server/demoTenant";
import { queryPg, queryPgOne } from "$lib/server/pg";
import { putSession } from "$lib/server/session-store";

const MFA_CHALLENGE_TTL = 300;

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const env = {
    ...process.env,
    ...((platform?.env as Record<string, string | undefined>) ?? {}),
  };
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return json({ error: "Email and password required" }, { status: 400 });
  }

  const demoMode = String(env.DEMO_MODE ?? "false").toLowerCase() === "true";
  const demoConfig = resolveDemoTenantConfig(env);
  const jwtSecret = env.JWT_SECRET || env.SESSION_SECRET;
  if (!jwtSecret) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "auth.missing_jwt_secret",
        message: "JWT_SECRET or SESSION_SECRET must be configured",
      }),
    );
    return json({ error: "Authentication service misconfigured" }, { status: 503 });
  }

  if (
    demoMode &&
    demoConfig &&
    email.toLowerCase() === demoConfig.email &&
    password === demoConfig.password
  ) {
    try {
      const { getPgPool } = await import("$lib/server/pg");
      const pool = getPgPool();
      await resetDemoTenant(pool as unknown as D1Database, demoConfig);
    } catch {
      // keep login path resilient
    }
  }

  // Super admin fallback (no DB required)
  const superEmail = (env.SUPER_ADMIN_EMAIL || "").toLowerCase();
  const superPass = env.ADMIN_PASSWORD;
  if (superPass && email.toLowerCase() === superEmail && password === superPass) {
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
    await putSession(sid, user, 604800);
    cookies.set("atlas_session", sid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
    return json({ success: true, email: user.email });
  }

  try {
    const row = await queryPgOne<{
      id: string;
      email: string;
      password_hash: string;
      salt: string;
      display_name: string | null;
      roles: string;
      tenant_id: string;
    }>(
      "SELECT id, email, password_hash, salt, display_name, roles, tenant_id FROM console_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email.toLowerCase()],
    );

    if (!row) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, row.salt, row.password_hash);
    if (!valid) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!row.password_hash.startsWith("pbkdf2$")) {
      const newHash = await hashPasswordPBKDF2(password, row.salt);
      await queryPg("UPDATE console_users SET password_hash = $1 WHERE id = $2", [newHash, row.id]);
    }

    await queryPg("UPDATE console_users SET last_login = $1 WHERE id = $2", [
      new Date().toISOString(),
      row.id,
    ]);

    let roles: string[];
    try {
      const parsed = typeof row.roles === "string" ? JSON.parse(row.roles) : row.roles;
      roles = Array.isArray(parsed) ? parsed : ["admin"];
    } catch {
      roles = ["admin"];
    }

    const isSuperAdmin = roles.includes("super-admin") || row.email.toLowerCase() === superEmail;

    if (isSuperAdmin) {
      if (!roles.includes("super-admin")) roles.push("super-admin");
      if (!roles.includes("owner")) roles.push("owner");
    }

    const secPolicy = await loadTenantSecurityPolicy(row.tenant_id);

    const mfaRow = await queryPgOne<{ verified: boolean }>(
      "SELECT verified FROM mfa_totp_secrets WHERE user_id = $1 AND verified = true",
      [row.id],
    );

    const hasMfaEnrolled = !!mfaRow;
    const mfaRequiredByPolicy = isMfaRequiredForUser(secPolicy, roles);

    if (hasMfaEnrolled) {
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
      const sessionTtl = 900;
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
      await putSession(sid, user, sessionTtl);
      cookies.set("atlas_session", sid, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: sessionTtl,
      });
      return json({ success: true, email: user.email, mfaSetupRequired: true });
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

    await putSession(sid, user, sessionTtl);
    cookies.set("atlas_session", sid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: sessionTtl,
    });

    return json({ success: true, email: user.email });
  } catch (e: unknown) {
    console.error("Login error:", e);
    return json({ error: "Authentication service error" }, { status: 500 });
  }
};

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
