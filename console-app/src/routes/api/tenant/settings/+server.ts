import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";
import { toCamel } from "$lib/utils/dto";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const tenant = await db
    .prepare(
      `SELECT id, name, owner_email, industry, size, created_at, status FROM tenants WHERE id = ?`,
    )
    .bind(user.tenantId)
    .first();

  if (!tenant) {
    return json({ error: "Tenant not found" }, { status: 404 });
  }

  return json(toCamel(tenant));
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  const denied = requireTenantRole(user, ["owner"]);
  if (denied) return denied;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { name, industry, size } = body as {
    name?: string;
    industry?: string;
    size?: string;
  };

  await db
    .prepare(
      `UPDATE tenants SET name = COALESCE(?, name), industry = COALESCE(?, industry), size = COALESCE(?, size) WHERE id = ?`,
    )
    .bind(name ?? null, industry ?? null, size ?? null, user!.tenantId)
    .run();

  await writeAudit(db, {
    tenantId: user!.tenantId!,
    actorUserId: user!.userId,
    actorEmail: user!.email,
    action: "tenant.settings_updated",
    targetType: "tenant",
    targetId: user!.tenantId,
    detail: JSON.stringify({ name, industry, size }),
  });

  return json({ success: true });
};
