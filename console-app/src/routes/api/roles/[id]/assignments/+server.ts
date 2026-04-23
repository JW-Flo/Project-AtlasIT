import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const results = await queryPg(
    `SELECT id, target_type, target_id, created_at FROM role_assignments
     WHERE role_id = $1 AND tenant_id = $2`,
    [params.id!, tenantId],
  );

  return json({
    assignments: results.map((a: any) => ({
      id: a.id,
      targetType: a.target_type,
      targetId: a.target_id,
      createdAt: a.created_at,
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

  const { targetType, targetId } = body;
  if (!targetType || !targetId) {
    return json({ error: "targetType and targetId are required" }, { status: 400 });
  }
  if (targetType !== "user" && targetType !== "group") {
    return json({ error: "targetType must be 'user' or 'group'" }, { status: 400 });
  }

  const role = await queryPgOne(`SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`, [
    params.id!,
    tenantId,
  ]);

  if (!role) return json({ error: "Role not found" }, { status: 404 });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await queryPg(
    `INSERT INTO role_assignments (id, tenant_id, role_id, target_type, target_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, tenantId, params.id!, targetType, targetId, now],
  );

  return json(
    {
      assignment: {
        id,
        targetType,
        targetId,
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

  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");
  if (!targetType || !targetId) {
    return json(
      { error: "targetType and targetId query parameters are required" },
      { status: 400 },
    );
  }

  const existing = await queryPgOne(
    `SELECT id FROM role_assignments
     WHERE role_id = $1 AND tenant_id = $2 AND target_type = $3 AND target_id = $4`,
    [params.id!, tenantId, targetType, targetId],
  );

  if (!existing) return json({ error: "Assignment not found" }, { status: 404 });

  await queryPg(
    `DELETE FROM role_assignments
     WHERE role_id = $1 AND tenant_id = $2 AND target_type = $3 AND target_id = $4`,
    [params.id!, tenantId, targetType, targetId],
  );

  return json({ ok: true });
};
