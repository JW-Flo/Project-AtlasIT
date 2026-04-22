import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ totpEnabled: false, recoveryCodesRemaining: 0 });
  try {
    const totp = await db.prepare(
      "SELECT verified, enabled_at FROM mfa_totp_secrets WHERE user_id = ? AND verified = 1"
    ).bind(user.userId).first();
    const rcCount = await db.prepare(
      "SELECT COUNT(*) as cnt FROM mfa_recovery_codes WHERE user_id = ? AND used_at IS NULL"
    ).bind(user.userId).first();
    return json({
      totpEnabled: !!totp,
      enabledAt: totp?.enabled_at || null,
      recoveryCodesRemaining: rcCount?.cnt || 0
    });
  } catch (e) {
    console.error("MFA status check error:", e);
    return json({ totpEnabled: false, recoveryCodesRemaining: 0 });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-DzJc_smC.js.map
