import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { verifyTotp, decryptTotpSecret, isEncryptedSecret } from "@atlasit/shared/crypto/totp";
import { writeAudit } from "$lib/server/audit";

/** Disable TOTP MFA — requires a valid TOTP code from the active authenticator. */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  const encryptionKey: string | undefined = env.CRED_ENCRYPTION_KEY;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { code } = body as { code?: string };

  if (!code) return json({ error: "TOTP code required to disable MFA" }, { status: 400 });

  const totpRow = await db
    .prepare("SELECT secret_encrypted FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1")
    .bind(user.userId)
    .first<{ secret_encrypted: string }>();

  if (!totpRow) return json({ error: "MFA is not enrolled" }, { status: 400 });

  let totpSecret = totpRow.secret_encrypted;
  if (encryptionKey && isEncryptedSecret(totpSecret)) {
    totpSecret = await decryptTotpSecret(totpSecret, encryptionKey);
  }

  const result = await verifyTotp(totpSecret, code);
  if (!result.valid) return json({ error: "Invalid code" }, { status: 401 });

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
