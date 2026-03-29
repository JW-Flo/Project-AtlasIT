import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const { id } = params;

  try {
    const policy = await db
      .prepare(`SELECT id, status FROM policies WHERE id = ? AND tenant_id = ?`)
      .bind(id, tenantId)
      .first<any>();

    if (!policy) return json({ error: "Policy not found" }, { status: 404 });

    if (policy.status !== "approved") {
      return json(
        { error: "Policy can only be archived when in approved status" },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();

    await db
      .prepare(
        `UPDATE policies SET status = 'archived', updated_at = ? WHERE id = ? AND tenant_id = ?`,
      )
      .bind(now, id, tenantId)
      .run();

    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId ?? "unknown",
        actorEmail: user.email ?? "unknown",
        action: "policy.archived",
        targetType: "policy",
        targetId: id,
      });
    } catch {
      // Non-blocking
    }

    return json({ id, status: "archived" });
  } catch (e: any) {
    return json({ error: `Failed to archive policy: ${e?.message}` }, { status: 500 });
  }
};
