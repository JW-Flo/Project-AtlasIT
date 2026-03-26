import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ provider: null }, { status: 200 });

  const row = await db
    .prepare(`SELECT provider, status FROM directory_connections WHERE tenant_id = ? LIMIT 1`)
    .bind(tenantId)
    .first();

  return json({ provider: row?.provider ?? null, status: row?.status ?? null });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, { status: 400 });
  }

  const { provider, domain } = body;
  const validProviders = ["okta", "google_workspace", "microsoft_365"];
  if (!provider || !validProviders.includes(provider)) {
    return json({ error: "invalid provider" }, { status: 400 });
  }

  const connectionId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO directory_connections (id, tenant_id, provider, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?)
       ON CONFLICT(tenant_id) DO UPDATE SET provider = excluded.provider, status = 'pending', updated_at = excluded.updated_at`,
    )
    .bind(connectionId, tenantId, provider, now, now)
    .run();

  if (provider === "okta" && domain) {
    const credId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO app_credentials (id, tenant_id, app_id, credentials, created_at, updated_at)
         VALUES (?, ?, 'okta', ?, ?, ?)
         ON CONFLICT(tenant_id, app_id) DO UPDATE SET credentials = excluded.credentials, updated_at = excluded.updated_at`,
      )
      .bind(credId, tenantId, JSON.stringify({ domain }), now, now)
      .run();
  }

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "directory.connect",
    targetType: "directory_connection",
    targetId: connectionId,
    detail: JSON.stringify({ provider, domain }),
  });

  const row = await db
    .prepare(`SELECT id FROM directory_connections WHERE tenant_id = ?`)
    .bind(tenantId)
    .first();

  return json({ success: true, connectionId: row?.id ?? connectionId });
};
