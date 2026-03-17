import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const row = (await db
    .prepare(
      "SELECT id, email, display_name, roles, tenant_id, created_at FROM console_users WHERE id = ? LIMIT 1",
    )
    .bind(user.userId)
    .first()) as {
    id: string;
    email: string;
    display_name: string | null;
    roles: string;
    tenant_id: string;
    created_at: string;
  } | null;

  if (!row) {
    return json({
      email: user.email,
      displayName: user.displayName || user.email,
      roles: user.roles || [],
      tenantId: user.tenantId,
    });
  }

  let roles: string[];
  try {
    roles = JSON.parse(row.roles || '["admin"]');
  } catch {
    roles = ["admin"];
  }

  return json({
    email: row.email,
    displayName: row.display_name || row.email,
    roles,
    tenantId: row.tenant_id,
    createdAt: row.created_at,
  });
};

export const PATCH: RequestHandler = async ({
  request,
  locals,
  platform,
  cookies,
}) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { displayName } = body as { displayName?: string };

  if (!displayName || !displayName.trim()) {
    return json({ error: "Display name is required" }, { status: 400 });
  }
  if (displayName.length > 100) {
    return json(
      { error: "Display name must be 100 characters or less" },
      { status: 400 },
    );
  }

  await db
    .prepare("UPDATE console_users SET display_name = ? WHERE id = ?")
    .bind(displayName.trim(), user.userId)
    .run();

  // Update KV session so sidebar reflects new name immediately
  if (kv) {
    const sid = cookies.get("atlas_session");
    if (sid) {
      try {
        const raw = await kv.get(sid);
        if (raw) {
          const sessionData = JSON.parse(raw);
          sessionData.displayName = displayName.trim();
          await kv.put(sid, JSON.stringify(sessionData), {
            expirationTtl: 604800,
          });
        }
      } catch {}
    }
  }

  await writeAudit(db, {
    tenantId: user.tenantId!,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "user.profile_updated",
    targetType: "user",
    targetId: user.userId,
    detail: JSON.stringify({ displayName: displayName.trim() }),
  });

  return json({ success: true });
};
