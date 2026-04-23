import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";
import { requireTenantRole } from "$lib/server/guards";
import { queryPg, queryPgOne } from "$lib/server/pg";

/**
 * Group name → app mapping patterns.
 * Each entry: [regex matching group names, array of app IDs to suggest]
 */
const GROUP_APP_PATTERNS: [RegExp, string[]][] = [
  // Engineering & Development
  [
    /engineer|dev|developer|eng\b|development|backend|frontend|fullstack|swe\b|software/i,
    ["github", "jira", "slack", "google-workspace"],
  ],
  [/devops|platform|infra|sre|reliability|cloud/i, ["github", "jira", "aws", "datadog", "slack"]],
  [/qa|quality|testing|test\b/i, ["github", "jira", "slack"]],

  // Product & Design
  [/product|pm\b|product.?manager/i, ["jira", "slack", "google-workspace"]],
  [/design|ux|ui\b|creative/i, ["jira", "slack", "google-workspace"]],

  // Business & Operations
  [/finance|accounting|payroll|billing/i, ["quickbooks", "xero", "slack", "google-workspace"]],
  [/hr|people|talent|recruiting|human.?resource/i, ["bamboohr", "slack", "google-workspace"]],
  [/sales|revenue|bdr|sdr|account.?exec/i, ["salesforce", "slack", "google-workspace"]],
  [/marketing|growth|content|comms/i, ["slack", "google-workspace", "jira"]],
  [/support|customer.?success|cs\b|helpdesk/i, ["zendesk", "slack", "jira"]],
  [/ops|operations|admin/i, ["slack", "google-workspace", "jira"]],
  [/legal|compliance|governance/i, ["google-workspace", "slack"]],
  [/exec|leadership|management|c.?suite|director/i, ["slack", "google-workspace", "okta"]],

  // Security
  [/security|infosec|soc\b|cyber/i, ["crowdstrike", "okta", "github", "slack"]],

  // Catch-all: "everyone" or "all" groups → universal apps
  [/everyone|all.?staff|all.?employees|company|org\b|team/i, ["slack", "google-workspace"]],
];

/**
 * App category → default apps mapping.
 * When user attributes (department/title) are available, map them to app categories.
 */
const DEPARTMENT_APP_MAP: Record<string, string[]> = {
  engineering: ["github", "jira", "slack"],
  product: ["jira", "slack"],
  design: ["jira", "slack"],
  finance: ["quickbooks", "slack"],
  hr: ["bamboohr", "slack"],
  sales: ["salesforce", "slack"],
  marketing: ["slack", "jira"],
  support: ["zendesk", "slack"],
  security: ["crowdstrike", "okta", "slack"],
  it: ["okta", "jira", "slack", "github"],
  operations: ["slack", "jira"],
};

export const POST: RequestHandler = async ({ locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  // Get connected apps, groups, existing mappings, and tenant ecosystem in parallel
  const [groupsResult, connectedAppsResult, existingMappingsResult, selectedAppsResult] =
    await Promise.allSettled([
      queryPg<{ id: string; name: string }>(
        `SELECT id, name FROM directory_groups WHERE tenant_id = $1`,
        [tenantId],
      ),
      queryPg<{ app_id: string }>(`SELECT app_id FROM app_credentials WHERE tenant_id = $1`, [
        tenantId,
      ]).then((rows) => rows.map((row) => row.app_id)),
      queryPg<{ group_id: string; app_id: string }>(
        `SELECT group_id, app_id FROM group_app_mappings WHERE tenant_id = $1`,
        [tenantId],
      ).then((rows) => {
        const set = new Set<string>();
        for (const row of rows) {
          set.add(`${row.group_id}:${row.app_id}`);
        }
        return set;
      }),
      queryPgOne<{ value: string }>(
        `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'selected_apps'`,
        [tenantId],
      ),
    ]);

  const groups: any[] = groupsResult.status === "fulfilled" ? groupsResult.value : [];
  const allConnectedApps: string[] =
    connectedAppsResult.status === "fulfilled" ? connectedAppsResult.value : [];
  const existingMappings: Set<string> =
    existingMappingsResult.status === "fulfilled" ? existingMappingsResult.value : new Set();

  // Restrict to tenant's selected ecosystem when available
  let selectedApps: string[] = [];
  if (selectedAppsResult.status === "fulfilled" && selectedAppsResult.value?.value) {
    try {
      selectedApps = JSON.parse(selectedAppsResult.value.value);
    } catch {
      // ignore
    }
  }
  const connectedApps =
    selectedApps.length > 0
      ? allConnectedApps.filter((id) => selectedApps.includes(id))
      : allConnectedApps;

  if (groups.length === 0) {
    return json({
      suggestions: [],
      message:
        "No directory groups found. Sync your directory first to generate mapping suggestions.",
      connectedApps: connectedApps.length,
      groupsScanned: 0,
    });
  }
  if (connectedApps.length === 0) {
    return json({
      suggestions: [],
      message:
        "No apps connected. Connect apps in the Integrations page to generate mapping suggestions.",
      connectedApps: 0,
      groupsScanned: groups.length,
    });
  }

  const connectedSet = new Set(connectedApps);
  const now = new Date().toISOString();

  // Collect all candidate suggestions
  const candidates: { id: string; groupId: string; groupName: string; appId: string }[] = [];

  for (const group of groups) {
    for (const [pattern, appIds] of GROUP_APP_PATTERNS) {
      if (!pattern.test(group.name)) continue;

      const matchedApps = appIds.filter((id) => connectedSet.has(id));

      for (const appId of matchedApps) {
        if (existingMappings.has(`${group.id}:${appId}`)) continue;

        const id = crypto.randomUUID();
        candidates.push({ id, groupId: group.id, groupName: group.name, appId });
      }
    }
  }

  // Insert all candidates
  const suggestions: any[] = [];
  if (candidates.length > 0) {
    for (const candidate of candidates) {
      try {
        await queryPg(
          `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'member', true, NOW(), NOW())
           ON CONFLICT(tenant_id, group_id, app_id) DO NOTHING`,
          [candidate.id, tenantId, candidate.groupId, candidate.appId],
        );
        suggestions.push({
          id: candidate.id,
          groupId: candidate.groupId,
          groupName: candidate.groupName,
          appId: candidate.appId,
          role: "member",
          suggested: 1,
        });
      } catch {
        // Skip on conflict
      }
    }
  }

  if (suggestions.length > 0) {
    try {
      await queryPg(
        `INSERT INTO audit_log (id, tenant_id, actor_id, action, resource_type, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          crypto.randomUUID(),
          tenantId,
          user.userId,
          "mapping.auto_suggest",
          "group_app_mapping",
          JSON.stringify({
            actorEmail: user.email,
            detail: JSON.stringify({
              count: suggestions.length,
              apps: [...new Set(suggestions.map((s: any) => s.appId))],
            }),
          }),
        ],
      );
    } catch {
      // Audit write failure should not break the response
    }
  }

  return json({ suggestions, connectedApps: connectedApps.length, groupsScanned: groups.length });
};
