import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { listRules, listDismissedSuggestions, dismissSuggestion } from "$lib/server/automation-pg";
import { listConnectedApps } from "$lib/server/credentials";
import { generateSuggestions, generatePatternSuggestions } from "@atlasit/shared";
import { integrations } from "$lib/data/integrations";
import { queryPg, queryPgOne } from "$lib/server/pg.js";

/**
 * GET /api/automation/suggestions
 * Returns AI-generated automation suggestions based on tenant's current state.
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  // Gather tenant state + event history + dismissed list — isolated so a
  // single failing data source does not abort the entire response.
  const [
    rulesResult,
    connectedRawResult,
    mappingsSettled,
    eventHistorySettled,
    dismissedResult,
    selectedAppsResult,
  ] = await Promise.allSettled([
    listRules(tenantId),
    listConnectedApps(platform, tenantId),
    queryPg<any>(
      `SELECT m.group_id as groupId, g.name as groupName, m.app_id as appId, m.role
       FROM group_app_mappings m
       LEFT JOIN directory_groups g ON g.id = m.group_id
       WHERE m.tenant_id = $1`,
      [tenantId],
    ),
    queryPg<any>(
      `SELECT type, source, COUNT(*) as count, MAX(created_at) as latestAt
       FROM events
       WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY type, source
       ORDER BY count DESC
       LIMIT 50`,
      [tenantId],
    ),
    listDismissedSuggestions(tenantId),
    queryPgOne<{ value: string }>(
      "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'selected_apps'",
      [tenantId],
    ),
  ]);

  const warnings: string[] = [];

  const rules =
    rulesResult.status === "fulfilled"
      ? rulesResult.value
      : (console.error(
          JSON.stringify({
            source: "suggestions/rules",
            tenantId,
            error: String((rulesResult as PromiseRejectedResult).reason),
          }),
        ),
        warnings.push("rules"),
        []);

  const connectedRaw =
    connectedRawResult.status === "fulfilled"
      ? connectedRawResult.value
      : (console.error(
          JSON.stringify({
            source: "suggestions/connected-apps",
            tenantId,
            error: String((connectedRawResult as PromiseRejectedResult).reason),
          }),
        ),
        warnings.push("connected-apps"),
        []);

  const mappingsResult =
    mappingsSettled.status === "fulfilled"
      ? mappingsSettled.value
      : (console.error(
          JSON.stringify({
            source: "suggestions/group-mappings",
            tenantId,
            error: String((mappingsSettled as PromiseRejectedResult).reason),
          }),
        ),
        warnings.push("group-mappings"),
        []);

  const eventHistoryResult =
    eventHistorySettled.status === "fulfilled"
      ? eventHistorySettled.value
      : (console.error(
          JSON.stringify({
            source: "suggestions/event-history",
            tenantId,
            error: String((eventHistorySettled as PromiseRejectedResult).reason),
          }),
        ),
        warnings.push("event-history"),
        []);

  const dismissedIds =
    dismissedResult.status === "fulfilled"
      ? dismissedResult.value
      : (console.error(
          JSON.stringify({
            source: "suggestions/dismissed",
            tenantId,
            error: String((dismissedResult as PromiseRejectedResult).reason),
          }),
        ),
        warnings.push("dismissed"),
        []);

  // Build tenant's app allowlist: apps they selected during onboarding + actually connected
  let selectedApps: string[] = [];
  if (selectedAppsResult.status === "fulfilled" && selectedAppsResult.value?.value) {
    try {
      selectedApps = JSON.parse(selectedAppsResult.value.value);
    } catch {
      // malformed preference — ignore
    }
  }

  // Build the tenant's known app ecosystem: selected during onboarding
  const tenantEcosystem = new Set(selectedApps);

  // Filter connected apps to only those in the tenant's ecosystem.
  // If no ecosystem preference exists (pre-existing tenant), allow all connected apps.
  const allConnected = connectedRaw.map((c) => ({
    appId: c.app_id,
    appName: integrations.find((i) => i.id === c.app_id)?.name ?? c.app_id,
    healthy: c.healthy,
  }));
  const connectedApps =
    tenantEcosystem.size > 0
      ? allConnected.filter((a) => tenantEcosystem.has(a.appId))
      : allConnected;

  // Only surface group-mapping suggestions for apps in the tenant's ecosystem
  const relevantAppIds = new Set(connectedApps.map((a) => a.appId));
  const groupMappings = (mappingsResult || [])
    .filter((r: any) => relevantAppIds.has(r.appId))
    .map((r: any) => ({
      groupId: r.groupId,
      groupName: r.groupName || r.groupId,
      appId: r.appId,
      role: r.role || "member",
    }));

  const eventHistory = (eventHistoryResult || []).map((r: any) => ({
    type: r.type as string,
    source: r.source as string,
    count: r.count as number,
    latestAt: r.latestAt as string,
  }));

  const stateSuggestions = generateSuggestions(rules, connectedApps, groupMappings);
  const patternSuggestions = generatePatternSuggestions(rules, eventHistory);

  // Merge, deduplicate by templateId, and filter out dismissed
  const seen = new Set(stateSuggestions.map((s) => s.templateId));
  const dismissedSet = new Set(dismissedIds);
  const merged = [
    ...stateSuggestions,
    ...patternSuggestions.filter((s) => !seen.has(s.templateId)),
  ].filter((s) => !dismissedSet.has(s.templateId));

  const response: { suggestions: typeof merged; warnings?: string[] } = {
    suggestions: merged,
  };
  if (warnings.length > 0) response.warnings = warnings;

  return json(response);
};

/**
 * POST /api/automation/suggestions
 * Dismiss a suggestion by templateId.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: { templateId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.templateId) {
    return json({ error: "templateId is required" }, { status: 400 });
  }

  await dismissSuggestion(tenantId, body.templateId, user.email);
  return json({ ok: true });
};
