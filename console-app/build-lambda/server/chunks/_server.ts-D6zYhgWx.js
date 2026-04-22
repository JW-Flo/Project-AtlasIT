import { json } from '@sveltejs/kit';

const PREF_KEY = "dashboard_views";
const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ views: [], activeViewId: null });
  try {
    const row = await db.prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?`).bind(user.tenantId, PREF_KEY).first();
    if (!row?.value) {
      return json({ views: [], activeViewId: null });
    }
    const parsed = JSON.parse(row.value);
    return json(parsed);
  } catch {
    return json({ views: [], activeViewId: null });
  }
};
const PUT = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.views)) {
    return json({ error: "Invalid payload" }, { status: 400 });
  }
  try {
    await db.prepare(`INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value) VALUES (?, ?, ?)`).bind(user.tenantId, PREF_KEY, JSON.stringify(body)).run();
    return json({ success: true });
  } catch (e) {
    console.error("Dashboard views save error:", e);
    return json({ error: "Failed to save" }, { status: 500 });
  }
};

export { GET, PUT };
//# sourceMappingURL=_server.ts-D6zYhgWx.js.map
