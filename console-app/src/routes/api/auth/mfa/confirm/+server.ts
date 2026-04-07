import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { verifyTotp, decryptTotpSecret, isEncryptedSecret } from "@atlasit/shared/crypto/totp";
import { writeAudit } from "$lib/server/audit";

/** Confirm TOTP enrollment by verifying a code from the authenticator app. */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  const encryptionKey: string | undefined = env.CRED_ENCRYPTION_KEY;

  const body = await request.json().catch(() => ({}));
  const { code } = body as { code?: string };

  if (!code) return json({ error: "Code required" }, { status: 400 });

  const row = await db
    .prepare("SELECT secret_encrypted, verified FROM mfa_totp_secrets WHERE user_id = ?")
    .bind(user.userId)
    .first<{ secret_encrypted: string; verified: number }>();

  if (!row) return json({ error: "No TOTP setup in progress" }, { status: 404 });
  if (row.verified) return json({ error: "TOTP already verified" }, { status: 409 });

  // C-3 FIX: Decrypt secret before verification; support legacy plaintext for migration
  let totpSecret = row.secret_encrypted;
  if (encryptionKey && isEncryptedSecret(totpSecret)) {
    totpSecret = await decryptTotpSecret(totpSecret, encryptionKey);
  }

  const result = await verifyTotp(totpSecret, code);
  if (!result.valid) {
    return json(
      { error: "Invalid code. Check your authenticator app and try again." },
      { status: 401 },
    );
  }

  // Mark as verified
  await db
    .prepare("UPDATE mfa_totp_secrets SET verified = 1, enabled_at = ? WHERE user_id = ?")
    .bind(new Date().toISOString(), user.userId)
    .run();

  await writeAudit(db, {
    tenantId: user.tenantId!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mfa.totp_enabled",
    targetType: "user",
    targetId: user.userId,
  });

  return json({ success: true });
};
