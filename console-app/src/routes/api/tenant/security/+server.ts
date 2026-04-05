import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { resolveSecurityPolicy } from "@atlasit/shared/security/policies";
import type { TenantSecurityPolicy } from "@atlasit/shared/security/policies";
import { writeAudit } from "$lib/server/audit";

/** GET: Load tenant security policy */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ policy: resolveSecurityPolicy(null) });

  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?")
      .bind(user.tenantId, "security_policy")
      .first<{ value: string }>();

    const policy = resolveSecurityPolicy(row ? JSON.parse(row.value) : null);
    return json({ policy });
  } catch (e) {
    console.error("Security policy load error:", e);
    return json({ policy: resolveSecurityPolicy(null) });
  }
};

/** PUT: Update tenant security policy (owner only) */
export const PUT: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const updates = body as Partial<TenantSecurityPolicy>;

  // Validate bounds
  if (updates.sessionTtlSeconds !== undefined) {
    if (updates.sessionTtlSeconds < 900 || updates.sessionTtlSeconds > 2592000) {
      return json({ error: "Session TTL must be between 15 minutes and 30 days" }, { status: 400 });
    }
  }
  if (updates.mfaSessionTtlSeconds !== undefined) {
    if (updates.mfaSessionTtlSeconds < 900 || updates.mfaSessionTtlSeconds > 7776000) {
      return json(
        { error: "MFA session TTL must be between 15 minutes and 90 days" },
        { status: 400 },
      );
    }
  }
  if (updates.idleTimeoutSeconds !== undefined) {
    if (updates.idleTimeoutSeconds < 300 || updates.idleTimeoutSeconds > 604800) {
      return json({ error: "Idle timeout must be between 5 minutes and 7 days" }, { status: 400 });
    }
  }
  if (updates.minPasswordLength !== undefined) {
    if (updates.minPasswordLength < 8 || updates.minPasswordLength > 128) {
      return json({ error: "Min password length must be between 8 and 128" }, { status: 400 });
    }
  }

  try {
    // Load existing, merge, save
    const existing = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?")
      .bind(user!.tenantId, "security_policy")
      .first<{ value: string }>();

    const current = existing ? JSON.parse(existing.value) : {};
    const merged = resolveSecurityPolicy({ ...current, ...updates });
    const mergedJson = JSON.stringify(merged);
    const now = new Date().toISOString();

    // Delete + insert to avoid schema mismatches across environments
    await db.batch([
      db
        .prepare("DELETE FROM tenant_preferences WHERE tenant_id = ? AND key = ?")
        .bind(user!.tenantId, "security_policy"),
      db
        .prepare(
          "INSERT INTO tenant_preferences (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?)",
        )
        .bind(user!.tenantId, "security_policy", mergedJson, now),
    ]);

    await writeAudit(db, {
      tenantId: user!.tenantId!,
      actorUserId: user!.userId,
      actorEmail: user!.email,
      action: "security_policy.updated",
      targetType: "tenant",
      targetId: user!.tenantId!,
      detail: JSON.stringify(updates),
    });

    return json({ policy: merged });
  } catch (e: any) {
    console.error("Security policy save error:", e);
    const detail = e?.message || String(e);
    return json({ error: `Failed to save security policy: ${detail}` }, { status: 500 });
  }
};
