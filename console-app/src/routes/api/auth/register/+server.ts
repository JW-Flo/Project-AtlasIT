import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 310000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = (platform?.env as any) || {};
  const body = await request.json().catch(() => ({}));
  const { email, password, displayName, orgName } = body as {
    email?: string;
    password?: string;
    displayName?: string;
    orgName?: string;
  };

  if (!email || !password) {
    return json({ error: "Email and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const db = env.ATLAS_SHARED_DB;
  if (!db) {
    return json(
      { error: "Registration unavailable (no database)" },
      { status: 503 }
    );
  }

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
         )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS tenants (
           id TEXT PRIMARY KEY,
           name TEXT NOT NULL,
           owner_email TEXT NOT NULL,
           industry TEXT,
           size TEXT,
           created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
           status TEXT NOT NULL DEFAULT 'active'
         )`
      )
      .run();

    // Check if email already exists
    const existing = await db
      .prepare("SELECT id FROM console_users WHERE email = ? LIMIT 1")
      .bind(email.toLowerCase())
      .first();
    if (existing) {
      return json({ error: "Email already registered" }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const tenantId = orgName
      ? orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32)
      : `tenant-${userId.slice(0, 8)}`;
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);
    const now = new Date().toISOString();

    // Create tenant
    await db
      .prepare(
        `INSERT INTO tenants (id, name, owner_email, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .bind(tenantId, orgName || email.split("@")[0], email.toLowerCase(), now)
      .run();

    // Create user
    const isSuperAdmin =
      email.toLowerCase() ===
      (env.SUPER_ADMIN_EMAIL || "").toLowerCase();
    const roles = isSuperAdmin
      ? '["super-admin","admin"]'
      : '["admin"]';

    await db
      .prepare(
        `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        userId,
        email.toLowerCase(),
        passwordHash,
        salt,
        displayName || null,
        roles,
        tenantId,
        now
      )
      .run();

    return json({
      success: true,
      userId,
      tenantId,
      email: email.toLowerCase(),
    });
  } catch (e: any) {
    console.error("Registration error:", e);
    if (e?.message?.includes("UNIQUE")) {
      return json({ error: "Email already registered" }, { status: 409 });
    }
    return json({ error: "Registration failed" }, { status: 500 });
  }
};
