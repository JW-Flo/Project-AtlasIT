import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const { results } = await db
    .prepare(
      `SELECT id, app_id, app_role, created_at FROM role_app_entitlements
       WHERE role_id = ? AND tenant_id = ?`,
    )
    .bind(params.id!, tenantId)
    .all();

  return json({
    entitlements: (results ?? []).map((e: any) => ({
      id: e.id,
      appId: e.app_id,
      appRole: e.app_role,
      createdAt: e.created_at,
    })),
  });
};

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { appId, appRole } = body;
  if (!appId) {
    return json({ error: "appId is required" }, { status: 400 });
  }

  const role = await db
    .prepare(`SELECT id FROM roles WHERE id = ? AND tenant_id = ?`)
    .bind(params.id!, tenantId)
    .first();

  if (!role) return json({ error: "Role not found" }, { status: 404 });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO role_app_entitlements (id, tenant_id, role_id, app_id, app_role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, tenantId, params.id!, appId, appRole ?? "member", now)
    .run();

  return json(
    {
      entitlement: {
        id,
        appId,
        appRole: appRole ?? "member",
        createdAt: now,
      },
    },
    { status: 201 },
  );
};

export const DELETE: RequestHandler = async ({ params, url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const appId = url.searchParams.get("appId");
  if (!appId) {
    return json({ error: "appId query parameter is required" }, { status: 400 });
  }

  const existing = await db
    .prepare(
      `SELECT id FROM role_app_entitlements
       WHERE role_id = ? AND tenant_id = ? AND app_id = ?`,
    )
    .bind(params.id!, tenantId, appId)
    .first();

  if (!existing) return json({ error: "Entitlement not found" }, { status: 404 });

  await db
    .prepare(
      `DELETE FROM role_app_entitlements
       WHERE role_id = ? AND tenant_id = ? AND app_id = ?`,
    )
    .bind(params.id!, tenantId, appId)
    .run();

  return json({ ok: true });
};
