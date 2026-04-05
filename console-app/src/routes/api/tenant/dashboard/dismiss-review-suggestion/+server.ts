import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

/**
 * POST /api/tenant/dashboard/dismiss-review-suggestion
 * Dismisses an access review suggestion so it won't be shown again.
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { type } = body as { type?: string };
  if (!type) return json({ error: "type is required" }, { status: 400 });

  try {
    // Load existing dismissed list
    const existing = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'dismissed_review_suggestions'`,
      )
      .bind(user.tenantId)
      .first<{ value: string }>();

    let dismissed: string[] = [];
    try {
      if (existing?.value) dismissed = JSON.parse(existing.value);
    } catch {
      /* reset */
    }

    if (!dismissed.includes(type)) {
      dismissed.push(type);
    }

    await db
      .prepare(
        `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
         VALUES (?, 'dismissed_review_suggestions', ?, datetime('now'))
         ON CONFLICT (tenant_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .bind(user.tenantId, JSON.stringify(dismissed))
      .run();

    return json({ success: true });
  } catch (e) {
    console.error("Dismiss review suggestion error:", e);
    return json({ error: "Failed to dismiss suggestion" }, { status: 500 });
  }
};
