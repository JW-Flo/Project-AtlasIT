import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { hashPasswordPBKDF2, verifyPassword } from "$lib/server/password";
import { writeAuditPg } from "$lib/server/audit";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return json({ error: "Current and new passwords are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  const row = await queryPgOne<{ id: string; password_hash: string; salt: string }>(
    "SELECT id, password_hash, salt FROM console_users WHERE id = $1 LIMIT 1",
    [user.userId],
  );

  if (!row) {
    return json({ error: "User not found — password change not available" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, row.salt, row.password_hash);
  if (!valid) {
    return json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await hashPasswordPBKDF2(newPassword, row.salt);
  await queryPg("UPDATE console_users SET password_hash = $1 WHERE id = $2", [newHash, row.id]);

  await writeAuditPg({
    tenantId: user.tenantId!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "user.password_changed",
    targetType: "user",
    targetId: user.userId,
  });

  return json({ success: true });
};
