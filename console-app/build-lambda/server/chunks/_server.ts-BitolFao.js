import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ authenticated: false });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  let orgName;
  let branding = {};
  if (db && user.tenantId) {
    try {
      const tenant = await db.prepare(`SELECT name FROM tenants WHERE id = ?`).bind(user.tenantId).first();
      orgName = tenant?.name;
    } catch {
    }
    try {
      const { results: rows } = await db.prepare(
        `SELECT key, value FROM tenant_preferences WHERE tenant_id = ? AND key IN ('logo_url', 'accent_color')`
      ).bind(user.tenantId).all();
      for (const row of rows ?? []) {
        if (row.key === "logo_url") branding.logoUrl = row.value;
        if (row.key === "accent_color") branding.accentColor = row.value;
      }
    } catch {
    }
  }
  return json({
    authenticated: true,
    email: user.email,
    roles: user.roles,
    superAdmin: user.superAdmin,
    tenantId: user.tenantId,
    displayName: user.displayName,
    impersonating: user.impersonating,
    impersonatedBy: user.impersonatedBy,
    orgName,
    branding
  });
};

export { GET };
//# sourceMappingURL=_server.ts-BitolFao.js.map
