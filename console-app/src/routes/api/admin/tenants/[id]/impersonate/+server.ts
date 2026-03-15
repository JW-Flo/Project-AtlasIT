import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const POST: RequestHandler = async ({
  params,
  cookies,
  locals,
  platform,
}) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const user = locals.user!;
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS as KVNamespace | undefined;
  if (!db || !kv)
    return json({ error: "Service unavailable" }, { status: 500 });

  const owner = await db
    .prepare(
      `SELECT * FROM console_users WHERE tenant_id = ? AND roles LIKE '%owner%' LIMIT 1`,
    )
    .bind(params.id)
    .first();

  if (!owner) {
    return json({ error: "Tenant owner not found" }, { status: 404 });
  }

  const currentSessionId = cookies.get("atlas_session") ?? "";
  const roles: string[] = JSON.parse(owner.roles as string);
  const sessionData = {
    userId: owner.id,
    email: owner.email,
    roles,
    superAdmin: false,
    provider: "impersonation",
    tenantId: params.id,
    displayName: owner.display_name ?? owner.email,
    createdAt: owner.created_at,
    lastSeenAt: new Date().toISOString(),
    impersonating: true,
    impersonatedBy: user.email,
    originalSessionId: currentSessionId,
  };

  const newSessionId = crypto.randomUUID();
  await kv.put(newSessionId, JSON.stringify(sessionData), {
    expirationTtl: 3600,
  });

  cookies.set("atlas_session", newSessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });

  // Clear session cache so the impersonated session is read from KV
  cookies.set("atlas_session_cache", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  await writeAudit(db, {
    tenantId: params.id!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "tenant.impersonate",
    targetType: "user",
    targetId: owner.id as string,
  });

  return json({ success: true });
};
