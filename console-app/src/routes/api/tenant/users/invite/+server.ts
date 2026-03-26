import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  const hex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2$100000$${hex}`;
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { email, displayName, role } = body as {
    email?: string;
    displayName?: string;
    role?: "admin" | "member";
  };

  if (!email || !role || !["admin", "member"].includes(role)) {
    return json(
      { error: "email and role (admin|member) required" },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json({ error: "Invalid email format" }, { status: 400 });
  }

  const existing = await db
    .prepare(`SELECT id FROM console_users WHERE email = ? AND tenant_id = ?`)
    .bind(email, user!.tenantId)
    .first();

  if (existing) {
    return json(
      { error: "User already exists in this tenant" },
      { status: 409 },
    );
  }

  const tempPassword = crypto.randomUUID().slice(0, 12);
  const salt = crypto.randomUUID();
  const passwordHash = await hashPassword(tempPassword, salt);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      email,
      passwordHash,
      salt,
      displayName ?? null,
      JSON.stringify([role]),
      user!.tenantId,
      now,
    )
    .run();

  // Create linked directory user for the invited user
  const directoryUserId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, status, source, console_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      directoryUserId,
      user!.tenantId,
      "local:" + id,
      email,
      displayName ?? email,
      "active",
      "local",
      id,
      now,
      now,
    )
    .run();

  await writeAudit(db, {
    tenantId: user!.tenantId!,
    actorUserId: user!.userId,
    actorEmail: user!.email,
    action: "user.invited",
    targetType: "user",
    targetId: id,
    detail: JSON.stringify({ email, role }),
  });

  return json({ success: true, tempPassword });
};
