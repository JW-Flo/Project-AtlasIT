import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user?.superAdmin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json().catch(() => null);
  if (!body || !id) {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed = ["name", "slug", "tier", "status"] as const;
  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) {
    return json({ error: "No valid fields to update" }, { status: 400 });
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const row = await queryPgOne<{ id: string; name: string; status: string; tier: string }>(
    `UPDATE tenants SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, status, tier`,
    values,
  );

  if (!row) {
    return json({ error: "Tenant not found" }, { status: 404 });
  }

  return json(row);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user?.superAdmin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return json({ error: "Tenant ID required" }, { status: 400 });
  }

  const existing = await queryPgOne<{ id: string }>(`SELECT id FROM tenants WHERE id = $1`, [id]);

  if (!existing) {
    return json({ error: "Tenant not found" }, { status: 404 });
  }

  await queryPg(`DELETE FROM sessions WHERE data::text LIKE $1`, [`%"tenantId":"${id}"%`]);
  await queryPg(`DELETE FROM console_users WHERE tenant_id = $1`, [id]);
  await queryPg(`DELETE FROM tenant_billing WHERE tenant_id = $1`, [id]);
  await queryPg(`DELETE FROM tenants WHERE id = $1`, [id]);

  return json({ success: true, id });
};
