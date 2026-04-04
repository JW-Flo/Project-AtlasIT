import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return { session: { authenticated: false } };

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;

  let orgName: string | undefined;
  let branding: { logoUrl?: string; accentColor?: string } = {};

  if (db && user.tenantId) {
    try {
      const tenant = await db
        .prepare("SELECT name FROM tenants WHERE id = ?")
        .bind(user.tenantId)
        .first<{ name: string }>();
      orgName = tenant?.name;
    } catch {}

    try {
      const { results: rows } = await db
        .prepare(
          "SELECT key, value FROM tenant_preferences WHERE tenant_id = ? AND key IN ('logo_url', 'accent_color')",
        )
        .bind(user.tenantId)
        .all<{ key: string; value: string }>();
      for (const row of rows ?? []) {
        if (row.key === "logo_url") branding.logoUrl = row.value;
        if (row.key === "accent_color") branding.accentColor = row.value;
      }
    } catch {}
  }

  return {
    session: {
      authenticated: true,
      email: user.email,
      roles: user.roles,
      superAdmin: user.superAdmin,
      tenantId: user.tenantId,
      displayName: (user as any).displayName,
      impersonating: (user as any).impersonating,
      impersonatedBy: (user as any).impersonatedBy,
      orgName,
      branding,
    },
  };
};
