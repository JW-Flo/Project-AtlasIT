import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listRoleMappings, upsertRoleMapping } from "$lib/server/appManagement";

export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const roles = await listRoleMappings(platform, tenantId, params.appId!);
  return json({ roles });
};

export const POST: RequestHandler = async ({
  params,
  request,
  platform,
  locals,
}) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sourceRole || !body.targetRole) {
    return json(
      { error: "sourceRole and targetRole are required" },
      { status: 400 },
    );
  }

  const result = await upsertRoleMapping(
    platform,
    tenantId,
    params.appId!,
    body.sourceRole,
    body.targetRole,
  );
  if (!result.ok) return json({ error: result.error }, { status: 500 });
  return json({ success: true });
};
