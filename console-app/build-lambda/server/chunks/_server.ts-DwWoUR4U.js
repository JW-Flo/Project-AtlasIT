import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ apps: [] });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ apps: [] });
  try {
    const result = await db.prepare(`SELECT app_id FROM app_credentials WHERE tenant_id = ?`).bind(tenantId).all();
    const apps = (result.results ?? []).map((r) => ({ appId: r.app_id }));
    return json({ apps });
  } catch {
    return json({ apps: [] });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-DwWoUR4U.js.map
