import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";
import { toCamel } from "$lib/utils/dto";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ users: [], total: 0 });

  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "100", 10),
    500,
  );
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  const conditions: string[] = ["tenant_id = ?"];
  const binds: any[] = [tenantId];

  if (search) {
    conditions.push("(email LIKE ? OR display_name LIKE ?)");
    const pattern = `%${search}%`;
    binds.push(pattern, pattern);
  }

  if (status) {
    conditions.push("status = ?");
    binds.push(status);
  }

  const where = conditions.join(" AND ");

  const countRow = await db
    .prepare(`SELECT COUNT(*) as total FROM directory_users WHERE ${where}`)
    .bind(...binds)
    .first();

  const rows = await db
    .prepare(
      `SELECT id, external_id, email, display_name, department, title, status, source, console_user_id, created_at, updated_at
       FROM directory_users WHERE ${where}
       ORDER BY display_name ASC
       LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all()
    .then((r: any) => r.results || []);

  return json({ users: toCamel(rows), total: countRow?.total ?? 0 });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body?.email)
    return json({ error: "email is required" }, { status: 400 });

  const { email, displayName, department, title, status = "active" } = body;

  const newId = crypto.randomUUID();
  const externalId = `manual:${newId}`;
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, department, title, status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`,
    )
    .bind(
      newId,
      tenantId,
      externalId,
      email,
      displayName ?? null,
      department ?? null,
      title ?? null,
      status,
      now,
      now,
    )
    .run();

  const created = await db
    .prepare(
      `SELECT id, external_id, email, display_name, department, title, status, source, created_at, updated_at FROM directory_users WHERE id = ?`,
    )
    .bind(newId)
    .first();

  await writeAudit(db, {
    tenantId,
    actorUserId: user.userId ?? user.id,
    actorEmail: user.email,
    action: "directory_user.created",
    targetType: "directory_user",
    targetId: newId,
    detail: email,
  });

  return json({ user: toCamel(created) }, { status: 201 });
};
