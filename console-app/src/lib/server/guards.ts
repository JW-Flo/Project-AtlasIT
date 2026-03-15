import { json } from "@sveltejs/kit";

export function requireSuperAdmin(user: any): Response | null {
  if (!user?.superAdmin) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function requireTenantRole(user: any, roles: string[]): Response | null {
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.superAdmin) {
    return null;
  }
  const userRoles: string[] = user.roles ?? [];
  const hasRole = roles.some((r) => userRoles.includes(r));
  if (!hasRole) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
