import { json } from '@sveltejs/kit';
import { a as listRoleMappings, b as upsertRoleMapping } from './appManagement-sThwBf2A.js';

const GET = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  const roles = await listRoleMappings(platform, tenantId, params.appId);
  return json({ roles });
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
  if (!body.sourceRole || !body.targetRole) {
    return json(
      { error: "sourceRole and targetRole are required" },
      { status: 400 }
    );
  }
  const result = await upsertRoleMapping(
    platform,
    tenantId,
    params.appId,
    body.sourceRole,
    body.targetRole
  );
  if (!result.ok) return json({ error: result.error }, { status: 500 });
  return json({ success: true });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-DwsIIHab.js.map
