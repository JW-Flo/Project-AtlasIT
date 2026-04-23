import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg, queryPgOne } from "$lib/server/pg";

/**
 * POST /api/tenant/dashboard/dismiss-review-suggestion
 * Dismisses an access review suggestion so it won't be shown again.
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { type } = body as { type?: string };
  if (!type) return json({ error: "type is required" }, { status: 400 });

  try {
    // Load existing dismissed list
    const existing = await queryPgOne<{ value: string }>(
      `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'dismissed_review_suggestions'`,
      [user.tenantId],
    );

    let dismissed: string[] = [];
    try {
      if (existing?.value) dismissed = JSON.parse(existing.value);
    } catch {
      /* reset */
    }

    if (!dismissed.includes(type)) {
      dismissed.push(type);
    }

    await queryPg(
      `DELETE FROM tenant_preferences WHERE tenant_id = $1 AND key = 'dismissed_review_suggestions'`,
      [user.tenantId],
    );
    await queryPg(`INSERT INTO tenant_preferences (tenant_id, key, value) VALUES ($1, $2, $3)`, [
      user.tenantId,
      "dismissed_review_suggestions",
      JSON.stringify(dismissed),
    ]);

    return json({ success: true });
  } catch (e) {
    console.error("Dismiss review suggestion error:", e);
    return json({ error: "Failed to dismiss suggestion" }, { status: 500 });
  }
};
