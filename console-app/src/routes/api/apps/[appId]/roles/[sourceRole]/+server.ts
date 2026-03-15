import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { deleteRoleMapping } from "$lib/server/appManagement";

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const sourceRole = decodeURIComponent(params.sourceRole!);
  await deleteRoleMapping(platform, tenantId, params.appId!, sourceRole);
  return json({ success: true });
};
