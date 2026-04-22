import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { queryPgOne, queryPg } from "$lib/server/pg";
import crypto from "crypto";

// PATCH /api/admin/users/[id]/password — reset user password (tenant admin only)
export const PATCH: RequestHandler = async ({ locals, params }) => {
  const user = locals.user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only tenant admins (owner/admin role) can reset passwords
  const roles = user.roles || [];
  if (!roles.includes("owner") && !roles.includes("admin")) {
    return json({ error: "Forbidden: admin role required" }, { status: 403 });
  }

  const targetUserId = params.id;
  if (!targetUserId) {
    return json({ error: "User ID required" }, { status: 400 });
  }

  try {
    // Verify target user exists in same tenant
    const targetUser = await queryPgOne<{ id: string; email: string; tenant_id: string }>(
      `SELECT id, email, tenant_id FROM console_users WHERE id = $1`,
      [targetUserId],
    );

    if (!targetUser) {
      return json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.tenant_id !== user.tenantId) {
      return json({ error: "Forbidden: user not in your tenant" }, { status: 403 });
    }

    // Generate new random password
    const newPassword = crypto.randomBytes(12).toString("base64").slice(0, 16);
    const salt = crypto.randomBytes(16).toString("hex");

    // Hash with PBKDF2
    const hash = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(newPassword, salt, 100000, 64, "sha512", (err, derivedKey) => {
        if (err) reject(err);
        else resolve(`pbkdf2$${derivedKey.toString("hex")}`);
      });
    });

    // Update password
    await queryPg(
      `UPDATE console_users SET password_hash = $1, salt = $2, updated_at = NOW() WHERE id = $3`,
      [hash, salt, targetUserId],
    );

    // Log the action in audit log
    await queryPg(
      `INSERT INTO audit_log (id, tenant_id, user_id, action, resource_type, resource_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        crypto.randomUUID(),
        user.tenantId,
        user.userId,
        "password_reset",
        "console_user",
        targetUserId,
        JSON.stringify({ admin_email: user.email, target_email: targetUser.email }),
      ],
    );

    return json({
      status: "success",
      data: {
        userId: targetUserId,
        email: targetUser.email,
        newPassword, // Return to admin so they can communicate to user
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[admin/password-reset] error", { error: (e as Error).message });
    return json({ error: "Failed to reset password" }, { status: 500 });
  }
};
