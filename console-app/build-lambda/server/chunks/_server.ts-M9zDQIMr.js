import { json } from '@sveltejs/kit';
import { l as listGroupAssignments, u as upsertGroupAssignment } from './appManagement-sThwBf2A.js';

const GET = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  const groups = await listGroupAssignments(platform, tenantId, params.appId);
  return json({ groups });
};
const POST = async ({
  params,
  request,
  platform,
  locals
}) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.groupId || !body.groupName) {
    return json(
      { error: "groupId and groupName are required" },
      { status: 400 }
    );
  }
  const result = await upsertGroupAssignment(
    platform,
    tenantId,
    params.appId,
    body.groupId,
    body.groupName
  );
  if (!result.ok) return json({ error: result.error }, { status: 500 });
  return json({ success: true });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-M9zDQIMr.js.map
