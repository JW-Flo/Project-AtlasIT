import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { DailyDigest } from "@atlasit/shared";
import { queryPgOne } from "$lib/server/pg";

/** Fetch the latest daily AI digest for the current tenant */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  try {
    const row = await queryPgOne<{ value: string }>(
      "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = $2",
      [tenantId, "copilot_daily_digest"],
    );

    if (!row?.value) {
      return json({ digest: null });
    }

    const digest: DailyDigest = JSON.parse(row.value);
    return json({ digest });
  } catch {
    return json({ digest: null });
  }
};
