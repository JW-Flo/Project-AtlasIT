import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ digest: null });
  try {
    const row = await db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'copilot_weekly_digest'"
    ).bind(tenantId).first();
    if (!row?.value) {
      return json({ digest: null });
    }
    const digest = JSON.parse(row.value);
    return json({ digest });
  } catch {
    return json({ digest: null });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-Bi72GLWa.js.map
