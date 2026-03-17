import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listExecutions } from "$lib/server/automation";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ executions: [] });

  const ruleId = url.searchParams.get("ruleId") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const executions = await listExecutions(db, tenantId, { ruleId, limit });
  return json({ executions });
};
