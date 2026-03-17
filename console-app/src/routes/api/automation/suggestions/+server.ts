import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listRules } from "$lib/server/automation";
import { listConnectedApps } from "$lib/server/credentials";
import { generateSuggestions } from "@atlasit/shared/automation/learner";
import { integrations } from "$lib/data/integrations";

/**
 * GET /api/automation/suggestions
 * Returns AI-generated automation suggestions based on tenant's current state.
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ suggestions: [] });

  // Gather tenant state
  const [rules, connectedRaw, mappingsResult] = await Promise.all([
    listRules(db, tenantId),
    listConnectedApps(platform, tenantId),
    db
      .prepare(
        `SELECT m.group_id as groupId, g.name as groupName, m.app_id as appId, m.role
       FROM group_app_mappings m
       LEFT JOIN directory_groups g ON g.id = m.group_id
       WHERE m.tenant_id = ?`,
      )
      .bind(tenantId)
      .all(),
  ]);

  const connectedApps = connectedRaw.map((c) => ({
    appId: c.app_id,
    appName: integrations.find((i) => i.id === c.app_id)?.name ?? c.app_id,
    healthy: c.healthy,
  }));

  const groupMappings = (mappingsResult.results || []).map((r: any) => ({
    groupId: r.groupId,
    groupName: r.groupName || r.groupId,
    appId: r.appId,
    role: r.role || "member",
  }));

  const suggestions = generateSuggestions(rules, connectedApps, groupMappings);

  return json({ suggestions });
};
