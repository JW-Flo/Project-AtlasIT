import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";
import { hashPasswordPBKDF2 } from "$lib/server/password";
import { writeAudit } from "$lib/server/audit";

function generateTempPassword(length = 16): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const actor = locals.user!;
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  if (!email) return json({ error: "email required" }, { status: 400 });

  const row = await db
    .prepare("SELECT id, salt, tenant_id FROM console_users WHERE lower(email) = ?")
    .bind(email)
    .first<{ id: string; salt: string; tenant_id: string }>();

  if (!row) return json({ error: "User not found" }, { status: 404 });

  const tempPassword = generateTempPassword();
  const newHash = await hashPasswordPBKDF2(tempPassword, row.salt);

  await db
    .prepare("UPDATE console_users SET password_hash = ? WHERE id = ?")
    .bind(newHash, row.id)
    .run();

  await writeAudit(db, {
    tenantId: row.tenant_id,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    action: "user.password_reset",
    targetType: "user",
    targetId: row.id,
  });

  return json({ success: true, tempPassword });
};
