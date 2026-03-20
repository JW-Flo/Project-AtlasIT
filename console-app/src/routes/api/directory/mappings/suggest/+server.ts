import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

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
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  // Get connected apps, groups, and existing mappings in parallel (resilient to missing tables)
  const [groupsResult, connectedAppsResult, existingMappingsResult] = await Promise.allSettled([
    db
      .prepare(`SELECT id, name FROM directory_groups WHERE tenant_id = ?`)
      .bind(tenantId)
      .all()
      .then((r: any) => r.results || []),
    db
      .prepare(`SELECT app_id FROM app_credentials WHERE tenant_id = ?`)
      .bind(tenantId)
      .all()
      .then((r: any) => (r.results || []).map((row: any) => row.app_id as string)),
    db
      .prepare(`SELECT group_id, app_id FROM group_app_mappings WHERE tenant_id = ?`)
      .bind(tenantId)
      .all()
      .then((r: any) => {
        const set = new Set<string>();
        for (const row of r.results || []) {
          set.add(`${row.group_id}:${row.app_id}`);
        }
        return set;
      }),
  ]);

  const groups: any[] = groupsResult.status === "fulfilled" ? groupsResult.value : [];
  const connectedApps: string[] =
    connectedAppsResult.status === "fulfilled" ? connectedAppsResult.value : [];
  const existingMappings: Set<string> =
    existingMappingsResult.status === "fulfilled" ? existingMappingsResult.value : new Set();

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
  const suggestions: any[] = [];

  for (const group of groups) {
    for (const [pattern, appIds] of GROUP_APP_PATTERNS) {
      if (!pattern.test(group.name)) continue;

      // Only suggest apps that are actually connected
      const matchedApps = appIds.filter((id) => connectedSet.has(id));

      for (const appId of matchedApps) {
        // Skip if mapping already exists
        if (existingMappings.has(`${group.id}:${appId}`)) continue;

        const id = crypto.randomUUID();
        const result = await db
          .prepare(
            `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'member', 1, ?, ?)
             ON CONFLICT(tenant_id, group_id, app_id) DO NOTHING`,
          )
          .bind(id, tenantId, group.id, appId, now, now)
          .run();

        if (result?.meta?.changes > 0) {
          suggestions.push({
            id,
            groupId: group.id,
            groupName: group.name,
            appId,
            role: "member",
            suggested: 1,
          });
        }
      }
    }
  }

  if (suggestions.length > 0) {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId,
      actorEmail: user.email,
      action: "mapping.auto_suggest",
      targetType: "group_app_mapping",
      detail: JSON.stringify({
        count: suggestions.length,
        apps: [...new Set(suggestions.map((s: any) => s.appId))],
      }),
    });
  }

  return json({ suggestions, connectedApps: connectedApps.length, groupsScanned: groups.length });
};
