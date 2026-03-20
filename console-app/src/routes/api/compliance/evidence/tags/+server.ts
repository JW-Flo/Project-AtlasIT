import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface UniqueTag {
  tag: string;
  tag_type: string;
  color: string | null;
  usage_count: number;
}

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const result = await db
    .prepare(
      `SELECT DISTINCT tag, tag_type, color, COUNT(*) as usage_count
       FROM evidence_tags
       WHERE tenant_id = ?
       GROUP BY tag, tag_type
       ORDER BY usage_count DESC`,
    )
    .bind(tenantId)
    .all();

  const tags: UniqueTag[] = (result.results ?? []).map((row: any) => ({
    tag: row.tag as string,
    tag_type: row.tag_type as string,
    color: (row.color as string) ?? null,
    usage_count: row.usage_count as number,
  }));

  return json({ tags });
};
