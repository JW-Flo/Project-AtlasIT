import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const result = await db.prepare(
    `SELECT DISTINCT tag, tag_type, color, COUNT(*) as usage_count
       FROM evidence_tags
       WHERE tenant_id = ?
       GROUP BY tag, tag_type
       ORDER BY usage_count DESC`
  ).bind(tenantId).all();
  const tags = (result.results ?? []).map((row) => ({
    tag: row.tag,
    tag_type: row.tag_type,
    color: row.color ?? null,
    usage_count: row.usage_count
  }));
  return json({ tags });
};

export { GET };
//# sourceMappingURL=_server.ts-D3WqeYxt.js.map
