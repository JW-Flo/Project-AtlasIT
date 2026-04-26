import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { evidenceData } from "$lib/server/dashboard-compat";

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  if (!user.tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  return json(await evidenceData(user.tenantId, url));
};
