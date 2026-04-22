import { json } from '@sveltejs/kit';
import { d as deleteGroupAssignment } from './appManagement-sThwBf2A.js';

const DELETE = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  await deleteGroupAssignment(
    platform,
    tenantId,
    params.appId,
    params.groupId
  );
  return json({ success: true });
};

export { DELETE };
//# sourceMappingURL=_server.ts-DdZnm-le.js.map
