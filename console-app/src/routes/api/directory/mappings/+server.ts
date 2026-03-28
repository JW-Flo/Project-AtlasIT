import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";
import { toCamel } from "$lib/utils/dto";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ mappings: [] });

  const rows = await db
    .prepare(
      `SELECT m.*, g.name as group_name
       FROM group_app_mappings m
       LEFT JOIN directory_groups g ON g.id = m.group_id
       WHERE m.tenant_id = ?
       ORDER BY g.name ASC, m.app_id ASC`,
    )
    .bind(tenantId)
    .all()
    .then((r: any) => r.results || []);

  return json({ mappings: toCamel(rows) });
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

  const { groupId, appId, role } = body;
  if (!groupId || !appId) {
    return json({ error: "groupId and appId are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    )
    .bind(id, tenantId, groupId, appId, role || "member", now, now)
    .run();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "mapping.create",
    targetType: "group_app_mapping",
    targetId: id,
    detail: JSON.stringify({ groupId, appId, role: role || "member" }),
  });

  const row = await db
    .prepare(`SELECT * FROM group_app_mappings WHERE id = ?`)
    .bind(id)
    .first();

  return json({ mapping: toCamel(row) });
};

export const DELETE: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  const mappingId = url.searchParams.get("id");
  if (!mappingId) return json({ error: "mapping id required" }, { status: 400 });

  await db
    .prepare("DELETE FROM group_app_mappings WHERE id = ? AND tenant_id = ?")
    .bind(mappingId, tenantId)
    .run();

  return json({ success: true });
};

export const PATCH: RequestHandler = async ({ request, url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  const mappingId = url.searchParams.get("id");
  if (!mappingId) return json({ error: "mapping id required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const { confirmed, role } = body as { confirmed?: boolean; role?: string };

  const updates: string[] = [];
  const params: unknown[] = [];

  if (confirmed !== undefined) {
    updates.push("suggested = ?");
    params.push(confirmed ? 0 : 1);
  }
  if (role) {
    updates.push("role = ?");
    params.push(role);
  }
  if (updates.length === 0) return json({ error: "nothing to update" }, { status: 400 });

  updates.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(mappingId, tenantId);

  await db
    .prepare(`UPDATE group_app_mappings SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`)
    .bind(...params)
    .run();

  return json({ success: true });
};
