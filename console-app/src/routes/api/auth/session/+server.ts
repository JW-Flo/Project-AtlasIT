import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { AuthSession } from "$lib/types/platform";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  const response: AuthSession = user
    ? { authenticated: true, email: user.email }
    : { authenticated: false };
  return json(response);
};
