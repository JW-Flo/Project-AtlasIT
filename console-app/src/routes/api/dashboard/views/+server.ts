import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg, queryPgOne } from "$lib/server/pg";

const PREF_KEY = "dashboard_views";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  try {
    const row = await queryPgOne<{ value: string }>(
      `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = $2`,
      [user.tenantId, PREF_KEY],
    );

    if (!row?.value) {
      return json({ views: [], activeViewId: null });
    }

    const parsed = JSON.parse(row.value);
    return json(parsed);
  } catch {
    return json({ views: [], activeViewId: null });
  }
};

export const PUT: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.views)) {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await queryPg(
      `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT(tenant_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [user.tenantId, PREF_KEY, JSON.stringify(body)],
    );

    return json({ success: true });
  } catch (e: any) {
    console.error("Dashboard views save error:", e);
    return json({ error: "Failed to save" }, { status: 500 });
  }
};
