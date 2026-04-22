import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ connected: false });
  const row = await db.prepare(`SELECT * FROM directory_connections WHERE tenant_id = ?`).bind(tenantId).first();
  if (!row) {
    return json({ connected: false });
  }
  return json({
    connected: true,
    id: row.id,
    provider: row.provider,
    status: row.status,
    errorMsg: row.error_msg,
    lastSyncAt: row.last_sync_at,
    userCount: row.user_count,
    groupCount: row.group_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
};

export { GET };
//# sourceMappingURL=_server.ts-Cct27nTy.js.map
