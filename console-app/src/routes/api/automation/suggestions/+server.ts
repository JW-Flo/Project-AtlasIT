import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listRules } from "$lib/server/automation";
import { listConnectedApps } from "$lib/server/credentials";
import {
  generateSuggestions,
  generatePatternSuggestions,
} from "@atlasit/shared/automation/learner";
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

  // Gather tenant state + event history
  const [rules, connectedRaw, mappingsResult, eventHistoryResult] =
    await Promise.all([
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
      db
        .prepare(
          `SELECT type, source, COUNT(*) as count, MAX(created_at) as latestAt
         FROM events
         WHERE tenant_id = ? AND created_at > datetime('now', '-30 days')
         GROUP BY type, source
         ORDER BY count DESC
         LIMIT 50`,
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

  const eventHistory = (eventHistoryResult.results || []).map((r: any) => ({
    type: r.type as string,
    source: r.source as string,
    count: r.count as number,
    latestAt: r.latestAt as string,
  }));

  const stateSuggestions = generateSuggestions(
    rules,
    connectedApps,
    groupMappings,
  );
  const patternSuggestions = generatePatternSuggestions(rules, eventHistory);

  // Merge and deduplicate by templateId
  const seen = new Set(stateSuggestions.map((s) => s.templateId));
  const merged = [
    ...stateSuggestions,
    ...patternSuggestions.filter((s) => !seen.has(s.templateId)),
  ];

  return json({ suggestions: merged });
};
