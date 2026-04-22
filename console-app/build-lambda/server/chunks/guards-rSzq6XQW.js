import { json } from '@sveltejs/kit';

function requireSuperAdmin(user) {
  if (!user?.superAdmin) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
function requireTenantRole(user, roles) {
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.superAdmin) {
    return null;
  }
  const userRoles = user.roles ?? [];
  const hasRole = roles.some((r) => userRoles.includes(r));
  if (!hasRole) {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export { requireSuperAdmin as a, requireTenantRole as r };
//# sourceMappingURL=guards-rSzq6XQW.js.map
