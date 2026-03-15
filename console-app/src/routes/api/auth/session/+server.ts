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
        impersonating: user.impersonating,
        impersonatedBy: user.impersonatedBy,
      }
    : { authenticated: false };
  return json(response);
};
