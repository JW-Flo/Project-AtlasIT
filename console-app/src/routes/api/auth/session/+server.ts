import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user) return json({ authenticated: false });

  let orgName: string | undefined;
  let branding: { logoUrl?: string; accentColor?: string } = {};

  if (user.tenantId) {
    try {
      const tenant = await queryPgOne<{ name: string }>(`SELECT name FROM tenants WHERE id = $1`, [
        user.tenantId,
      ]);
      orgName = tenant?.name;
    } catch {}

    try {
      const rows = await queryPg<{ key: string; value: string }>(
        `SELECT key, value FROM tenant_preferences WHERE tenant_id = $1 AND key IN ('logo_url', 'accent_color')`,
        [user.tenantId],
      );
      for (const row of rows) {
        if (row.key === "logo_url") branding.logoUrl = row.value;
        if (row.key === "accent_color") branding.accentColor = row.value;
      }
    } catch {}
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
    branding,
  });
};
