import { json } from '@sveltejs/kit';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const GROUP_APP_PATTERNS = [
  // Engineering & Development
  [
    /engineer|dev|developer|eng\b|development|backend|frontend|fullstack|swe\b|software/i,
    ["github", "jira", "slack", "google-workspace"]
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
  [/everyone|all.?staff|all.?employees|company|org\b|team/i, ["slack", "google-workspace"]]
];
const POST = async ({ locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  const [groupsResult, connectedAppsResult, existingMappingsResult, selectedAppsResult] = await Promise.allSettled([
    db.prepare(`SELECT id, name FROM directory_groups WHERE tenant_id = ?`).bind(tenantId).all().then((r) => r.results || []),
    db.prepare(`SELECT app_id FROM app_credentials WHERE tenant_id = ?`).bind(tenantId).all().then((r) => (r.results || []).map((row) => row.app_id)),
    db.prepare(`SELECT group_id, app_id FROM group_app_mappings WHERE tenant_id = ?`).bind(tenantId).all().then((r) => {
      const set = /* @__PURE__ */ new Set();
      for (const row of r.results || []) {
        set.add(`${row.group_id}:${row.app_id}`);
      }
      return set;
    }),
    db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'selected_apps'`
    ).bind(tenantId).first()
  ]);
  const groups = groupsResult.status === "fulfilled" ? groupsResult.value : [];
  const allConnectedApps = connectedAppsResult.status === "fulfilled" ? connectedAppsResult.value : [];
  const existingMappings = existingMappingsResult.status === "fulfilled" ? existingMappingsResult.value : /* @__PURE__ */ new Set();
  let selectedApps = [];
  if (selectedAppsResult.status === "fulfilled" && selectedAppsResult.value?.value) {
    try {
      selectedApps = JSON.parse(selectedAppsResult.value.value);
    } catch {
    }
  }
  const connectedApps = selectedApps.length > 0 ? allConnectedApps.filter((id) => selectedApps.includes(id)) : allConnectedApps;
  if (groups.length === 0) {
    return json({
      suggestions: [],
      message: "No directory groups found. Sync your directory first to generate mapping suggestions.",
      connectedApps: connectedApps.length,
      groupsScanned: 0
    });
  }
  if (connectedApps.length === 0) {
    return json({
      suggestions: [],
      message: "No apps connected. Connect apps in the Integrations page to generate mapping suggestions.",
      connectedApps: 0,
      groupsScanned: groups.length
    });
  }
  const connectedSet = new Set(connectedApps);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const candidates = [];
  const statements = [];
  for (const group of groups) {
    for (const [pattern, appIds] of GROUP_APP_PATTERNS) {
      if (!pattern.test(group.name)) continue;
      const matchedApps = appIds.filter((id) => connectedSet.has(id));
      for (const appId of matchedApps) {
        if (existingMappings.has(`${group.id}:${appId}`)) continue;
        const id = crypto.randomUUID();
        candidates.push({ id, groupId: group.id, groupName: group.name, appId });
        statements.push(
          db.prepare(
            `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'member', 1, ?, ?)
               ON CONFLICT(tenant_id, group_id, app_id) DO NOTHING`
          ).bind(id, tenantId, group.id, appId, now, now)
        );
      }
    }
  }
  const suggestions = [];
  if (statements.length > 0) {
    const results = await db.batch(statements);
    for (let i = 0; i < candidates.length; i++) {
      if (results[i]?.meta?.changes > 0) {
        suggestions.push({
          id: candidates[i].id,
          groupId: candidates[i].groupId,
          groupName: candidates[i].groupName,
          appId: candidates[i].appId,
          role: "member",
          suggested: 1
        });
      }
    }
  }
  if (suggestions.length > 0) {
    try {
      await writeAudit(db, {
        tenantId,
        actorUserId: user.userId,
        actorEmail: user.email,
        action: "mapping.auto_suggest",
        targetType: "group_app_mapping",
        detail: JSON.stringify({
          count: suggestions.length,
          apps: [...new Set(suggestions.map((s) => s.appId))]
        })
      });
    } catch {
    }
  }
  return json({ suggestions, connectedApps: connectedApps.length, groupsScanned: groups.length });
};

export { POST };
//# sourceMappingURL=_server.ts-Bo_IT1iv.js.map
