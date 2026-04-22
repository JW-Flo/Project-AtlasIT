import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';

const POST = async ({ request, platform, locals }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  const body = await request.json().catch(() => ({}));
  const { tenantId, industry, companySize, frameworks } = body;
  if (!tenantId) {
    return json({ error: "tenantId required" }, { status: 400 });
  }
  if (!user.superAdmin && user.tenantId !== tenantId) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  if (db) {
    try {
      await db.prepare(`UPDATE tenants SET industry = ?, size = ? WHERE id = ?`).bind(industry || null, companySize || null, tenantId).run();
      if (frameworks && frameworks.length > 0) {
        await db.prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
             VALUES (?, 'frameworks', ?)`
        ).bind(tenantId, JSON.stringify(frameworks)).run();
      }
    } catch (e) {
      console.error("Preferences save error:", e);
    }
  }
  return json({ success: true });
};

export { POST };
//# sourceMappingURL=_server.ts-DGEJqnEQ.js.map
