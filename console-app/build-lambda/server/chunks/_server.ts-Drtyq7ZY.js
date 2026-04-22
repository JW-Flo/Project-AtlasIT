import { json } from '@sveltejs/kit';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  try {
    const { results } = await db.prepare(
      `SELECT adapter_slug, collected_at, items_count, error
         FROM adapter_collection_health
         WHERE tenant_id = ?
         ORDER BY collected_at DESC`
    ).bind(user.tenantId).all();
    const adapters = (results ?? []).map((r) => ({
      slug: r.adapter_slug,
      collectedAt: r.collected_at,
      itemsCount: r.items_count,
      error: r.error
    }));
    return json({ adapters });
  } catch {
    return json({ adapters: [] });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-Drtyq7ZY.js.map
