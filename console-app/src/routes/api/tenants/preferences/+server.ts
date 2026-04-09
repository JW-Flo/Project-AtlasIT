import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
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

  if (db) {
    try {
      await db
        .prepare(`UPDATE tenants SET industry = ?, size = ? WHERE id = ?`)
        .bind(industry || null, companySize || null, tenantId)
        .run();

      // Table created via migration 0026_tenant_preferences.sql
      if (frameworks && frameworks.length > 0) {
        await db
          .prepare(
            `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
             VALUES (?, 'frameworks', ?)`,
          )
          .bind(tenantId, JSON.stringify(frameworks))
          .run();
      }
    } catch (e: any) {
      console.error("Preferences save error:", e);
    }
  }

  return json({ success: true });
};
