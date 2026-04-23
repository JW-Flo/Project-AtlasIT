import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { WeeklyDigest } from "@atlasit/shared";

/** Fetch the latest weekly AI digest for the current tenant */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ digest: null });

  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'copilot_weekly_digest'",
      )
      .bind(tenantId)
      .first<{ value: string }>();

    if (!row?.value) {
      return json({ digest: null });
    }

    const digest: WeeklyDigest = JSON.parse(row.value);
    return json({ digest });
  } catch {
    return json({ digest: null });
  }
};
