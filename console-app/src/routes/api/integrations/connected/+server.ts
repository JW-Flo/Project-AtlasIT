import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ apps: [] });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ apps: [] });

  try {
    const result = await db
      .prepare(`SELECT app_id FROM app_credentials WHERE tenant_id = ?`)
      .bind(tenantId)
      .all();
    const apps = (result.results ?? []).map((r: any) => ({ appId: r.app_id }));
    return json({ apps });
  } catch {
    return json({ apps: [] });
  }
};
