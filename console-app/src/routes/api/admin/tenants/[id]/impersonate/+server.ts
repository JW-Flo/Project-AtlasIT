import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { queryPgOne } from "$lib/server/pg";
import { putSession } from "$lib/server/session-store";

export const POST: RequestHandler = async ({ params, cookies, locals }) => {
  const user = locals.user;
  if (!user?.superAdmin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return json({ error: "Tenant ID required" }, { status: 400 });
  }

  const tenant = await queryPgOne<{ id: string; name: string; status: string }>(
    `SELECT id, name, status FROM tenants WHERE id = $1`,
    [id],
  );

  if (!tenant) {
    return json({ error: "Tenant not found" }, { status: 404 });
  }

  const owner = await queryPgOne<{ id: string; email: string; display_name: string | null }>(
    `SELECT id, email, display_name FROM console_users WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [id],
  );

  const originalSessionId = cookies.get("atlas_session") ?? "";
  const sid = crypto.randomUUID();

  const impersonatedSession: Record<string, unknown> = {
    userId: owner?.id ?? user.userId,
    email: owner?.email ?? user.email,
    displayName: owner?.display_name ?? "Tenant Admin",
    tenantId: id,
    roles: ["admin"],
    superAdmin: false,
    provider: "impersonation",
    impersonatedBy: user.userId,
    originalSessionId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  await putSession(sid, impersonatedSession, 900);

  cookies.set("atlas_session", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });

  cookies.set("atlas_session_cache", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return json({
    success: true,
    sessionId: sid,
    tenantId: id,
    tenantName: tenant.name,
    impersonating: owner?.email ?? "unknown",
  });
};
