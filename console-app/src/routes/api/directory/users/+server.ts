import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

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
      `SELECT id, external_id, email, display_name, department, title, status, created_at, updated_at
       FROM directory_users WHERE ${where}
       ORDER BY display_name ASC
       LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all()
    .then((r: any) => r.results || []);

  return json({ users: rows, total: countRow?.total ?? 0 });
};
