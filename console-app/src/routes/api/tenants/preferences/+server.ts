import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { queryPg } from "$lib/server/pg";

export const POST: RequestHandler = async ({ request, locals }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const body = await request.json().catch(() => ({}));
  const { tenantId, industry, companySize, frameworks } = body as {
    tenantId?: string;
    industry?: string;
    companySize?: string;
    frameworks?: string[];
  };

  if (!tenantId) {
    return json({ error: "tenantId required" }, { status: 400 });
  }

  // Enforce tenant ownership: non-superAdmin must have a matching tenantId
  if (!user.superAdmin && user.tenantId !== tenantId) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await queryPg(
      `UPDATE tenants SET industry = $1, size = $2 WHERE id = $3`,
      [industry || null, companySize || null, tenantId]
    );

    // Table created via migration 0026_tenant_preferences.sql
    if (frameworks && frameworks.length > 0) {
      await queryPg(
        `INSERT INTO tenant_preferences (tenant_id, key, value)
         VALUES ($1, 'frameworks', $2)
         ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value`,
        [tenantId, JSON.stringify(frameworks)]
      );
    }
  } catch (e: any) {
    console.error("Preferences save error:", e);
  }

  return json({ success: true });
};
