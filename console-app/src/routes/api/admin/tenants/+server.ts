import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user?.superAdmin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await queryPg<{
    id: string;
    name: string;
    slug: string;
    tier: string | null;
    status: string | null;
    created_at: string;
  }>(
    `SELECT id, name, slug, COALESCE(tier,'free') AS tier, COALESCE(status,'active') AS status, created_at FROM tenants ORDER BY created_at DESC`,
  );

  const tenantIds = rows.map((r) => r.id);

  let userCounts: Record<string, number> = {};
  let ownerEmails: Record<string, string> = {};
  if (tenantIds.length > 0) {
    const placeholders = tenantIds.map((_, i) => `$${i + 1}`).join(",");
    const counts = await queryPg<{ tenant_id: string; cnt: string }>(
      `SELECT tenant_id, COUNT(*)::text AS cnt FROM console_users WHERE tenant_id IN (${placeholders}) GROUP BY tenant_id`,
      tenantIds,
    );
    for (const c of counts) userCounts[c.tenant_id] = parseInt(c.cnt, 10);

    const owners = await queryPg<{ tenant_id: string; email: string }>(
      `SELECT DISTINCT ON (tenant_id) tenant_id, email FROM console_users WHERE tenant_id IN (${placeholders}) ORDER BY tenant_id, created_at ASC`,
      tenantIds,
    );
    for (const o of owners) ownerEmails[o.tenant_id] = o.email;
  }

  const tenants = rows.map((r) => ({
    id: r.id,
    name: r.name,
    ownerEmail: ownerEmails[r.id] ?? "",
    user_count: userCounts[r.id] ?? 0,
    status: r.status ?? "active",
    tier: r.tier ?? "free",
    createdAt: r.created_at,
  }));

  return json(tenants);
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.superAdmin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return json({ error: "Tenant name is required" }, { status: 400 });
  }

  const id =
    body.id ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  await queryPg(
    `INSERT INTO tenants (id, name, slug, tier, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [id, body.name, body.slug || id, body.tier || "free"],
  );

  return json({ id, name: body.name, status: "active" }, { status: 201 });
};
