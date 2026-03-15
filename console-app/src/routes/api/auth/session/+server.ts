import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  const response = user
    ? {
        authenticated: true,
        email: user.email,
        roles: user.roles,
        superAdmin: user.superAdmin,
        tenantId: user.tenantId,
        displayName: user.displayName,
        impersonating: (user as any).impersonating,
        impersonatedBy: (user as any).impersonatedBy,
      }
    : { authenticated: false };
  return json(response);
};
