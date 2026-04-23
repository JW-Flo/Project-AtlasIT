import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const results = await queryPg<{
    id: string;
    app_id: string;
    app_role: string;
    created_at: string;
  }>(
    `SELECT id, app_id, app_role, created_at FROM role_app_entitlements
     WHERE role_id = $1 AND tenant_id = $2`,
    [params.id!, tenantId],
  );

  return json({
    entitlements: results.map((e) => ({
      id: e.id,
      appId: e.app_id,
      appRole: e.app_role,
      createdAt: e.created_at,
    })),
  });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

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

  const role = await queryPgOne<{ id: string }>(
    `SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`,
    [params.id!, tenantId],
  );

  if (!role) return json({ error: "Role not found" }, { status: 404 });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await queryPg(
    `INSERT INTO role_app_entitlements (id, tenant_id, role_id, app_id, app_role, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, tenantId, params.id!, appId, appRole ?? "member", now],
  );

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

export const DELETE: RequestHandler = async ({ params, url, locals }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const appId = url.searchParams.get("appId");
  if (!appId) {
    return json({ error: "appId query parameter is required" }, { status: 400 });
  }

  const existing = await queryPgOne<{ id: string }>(
    `SELECT id FROM role_app_entitlements
     WHERE role_id = $1 AND tenant_id = $2 AND app_id = $3`,
    [params.id!, tenantId, appId],
  );

  if (!existing) return json({ error: "Entitlement not found" }, { status: 404 });

  await queryPg(
    `DELETE FROM role_app_entitlements
     WHERE role_id = $1 AND tenant_id = $2 AND app_id = $3`,
    [params.id!, tenantId, appId],
  );

  return json({ ok: true });
};
