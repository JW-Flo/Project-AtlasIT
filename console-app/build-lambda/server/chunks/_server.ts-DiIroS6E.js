import { json } from '@sveltejs/kit';
import { c as deleteRoleMapping } from './appManagement-sThwBf2A.js';

const DELETE = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  const sourceRole = decodeURIComponent(params.sourceRole);
  await deleteRoleMapping(platform, tenantId, params.appId, sourceRole);
  return json({ success: true });
};

export { DELETE };
//# sourceMappingURL=_server.ts-DiIroS6E.js.map
