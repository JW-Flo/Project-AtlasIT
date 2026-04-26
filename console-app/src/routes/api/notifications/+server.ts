import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { notificationsData } from "$lib/server/dashboard-compat";

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required" }, { status: 403 });
  }
  return json(await notificationsData(user, url.searchParams.get("unread") === "true"));
};
