import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { hashPasswordPBKDF2, verifyPassword } from "$lib/server/password";

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const env = (platform?.env as any) || {};
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return json({ error: "Email and password required" }, { status: 400 });
  }

  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;

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

  // D1-backed auth
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS console_users (
           id TEXT PRIMARY KEY,
           email TEXT NOT NULL UNIQUE,
           password_hash TEXT NOT NULL,
           salt TEXT NOT NULL,
           display_name TEXT,
           roles TEXT NOT NULL DEFAULT '["admin"]',
           tenant_id TEXT NOT NULL DEFAULT 'atlasit-prod',
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
           last_login TEXT
         )`,
      )
      .run();

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

    if (!kv) {
      return json({ error: "Session store unavailable" }, { status: 503 });
    }

    const sid = crypto.randomUUID();
    const user = {
      userId: row.id,
      email: row.email,
      displayName: row.display_name,
      roles,
      superAdmin:
        roles.includes("super-admin") ||
        row.email.toLowerCase() === (env.SUPER_ADMIN_EMAIL || "").toLowerCase(),
      provider: "password",
      tenantId: row.tenant_id,
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
  } catch (e: any) {
    console.error("Login error:", e);
    return json({ error: "Authentication service error" }, { status: 500 });
  }
};
