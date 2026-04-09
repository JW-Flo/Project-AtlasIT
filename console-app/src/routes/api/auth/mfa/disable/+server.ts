import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { verifyPassword } from "$lib/server/password";
import { writeAudit } from "$lib/server/audit";

/** Disable TOTP MFA — requires current password confirmation. */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password) return json({ error: "Password required to disable MFA" }, { status: 400 });

  // Verify current password
  const userRow = await db
    .prepare("SELECT password_hash, salt FROM console_users WHERE id = ?")
    .bind(user.userId)
    .first<{ password_hash: string; salt: string }>();

  if (!userRow) return json({ error: "User not found" }, { status: 404 });

  const valid = await verifyPassword(password, userRow.salt, userRow.password_hash);
  if (!valid) return json({ error: "Incorrect password" }, { status: 401 });

  // Delete TOTP secret and recovery codes
  await db.prepare("DELETE FROM mfa_totp_secrets WHERE user_id = ?").bind(user.userId).run();
  await db.prepare("DELETE FROM mfa_recovery_codes WHERE user_id = ?").bind(user.userId).run();

  await writeAudit(db, {
    tenantId: user.tenantId!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mfa.totp_disabled",
    targetType: "user",
    targetId: user.userId,
  });

  return json({ success: true });
};
