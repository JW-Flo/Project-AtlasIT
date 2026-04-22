import { json } from '@sveltejs/kit';
import { l as listRules, f as listDismissedSuggestions, h as dismissSuggestion } from './automation-pg-BL11rGe-.js';
import { l as listConnectedApps } from './credentials-CkBYNzQv.js';
import './gap-analyzer-CVZTZ0l9.js';
import { r as ruleTemplates } from './templates-CNh06UPP.js';
import { i as integrations } from './integrations-C0eSUhV4.js';
import { queryPg, queryPgOne } from './pg-BHX2Ay11.js';
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

function generateSuggestions(existingRules, connectedApps, groupMappings) {
  const suggestions = [];
  const existingTriggers = new Set(existingRules.map(ruleKey));
  const connectedAppIds = new Set(connectedApps.map((a) => a.appId));
  for (const mapping of groupMappings) {
    if (!connectedAppIds.has(mapping.appId))
      continue;
    const provisionKey = key("user_joined_group", mapping.groupId, mapping.appId);
    if (!existingTriggers.has(provisionKey)) {
      suggestions.push({
        templateId: "auto-provision-on-group-join",
        reason: `Users joining "${mapping.groupName}" could be auto-provisioned to ${mapping.appId} with role "${mapping.role}"`,
        priority: "high",
        ruleInput: {
          name: `Auto-provision ${mapping.appId} for ${mapping.groupName}`,
          description: `When a user joins the "${mapping.groupName}" group, automatically grant ${mapping.appId} access with the "${mapping.role}" role`,
          triggerType: "user_joined_group",
          triggerConfig: {
            groupId: mapping.groupId,
            groupName: mapping.groupName,
            appId: mapping.appId
          },
          conditions: [],
          actions: [
            {
              type: "provision_app_access",
              config: {
                appId: mapping.appId,
                role: mapping.role,
                groupId: mapping.groupId
              },
              order: 1
            },
            {
              type: "send_notification",
              config: {
                channel: "slack",
                template: "user_provisioned",
                notifyUser: true
              },
              order: 2
            }
          ]
        }
      });
    }
    const revokeKey = key("user_left_group", mapping.groupId, mapping.appId);
    if (!existingTriggers.has(revokeKey)) {
      suggestions.push({
        templateId: "auto-revoke-on-group-leave",
        reason: `Users leaving "${mapping.groupName}" should have ${mapping.appId} access revoked automatically`,
        priority: "high",
        ruleInput: {
          name: `Auto-revoke ${mapping.appId} for ${mapping.groupName}`,
          description: `When a user leaves the "${mapping.groupName}" group, automatically revoke ${mapping.appId} access`,
          triggerType: "user_left_group",
          triggerConfig: {
            groupId: mapping.groupId,
            groupName: mapping.groupName,
            appId: mapping.appId
          },
          conditions: [],
          actions: [
            {
              type: "revoke_app_access",
              config: { appId: mapping.appId, groupId: mapping.groupId },
              order: 1
            },
            {
              type: "send_notification",
              config: {
                channel: "slack",
                template: "user_deprovisioned",
                notifyAdmin: true
              },
              order: 2
            }
          ]
        }
      });
    }
  }
  const hasHealthRule = existingRules.some((r) => r.triggerType === "app_health_changed");
  if (connectedApps.length > 0 && !hasHealthRule) {
    const template = ruleTemplates.find((t) => t.id === "health-degradation-alert");
    suggestions.push({
      templateId: "health-degradation-alert",
      reason: `You have ${connectedApps.length} connected app(s) but no health monitoring — get alerted when apps go down`,
      priority: "medium",
      ruleInput: {
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        conditions: template.conditions,
        actions: template.actions
      }
    });
  }
  const hasOffboardRule = existingRules.some((r) => r.triggerType === "user_deactivated");
  if (connectedApps.length > 0 && !hasOffboardRule) {
    const template = ruleTemplates.find((t) => t.id === "offboard-user-on-deactivation");
    suggestions.push({
      templateId: "offboard-user-on-deactivation",
      reason: "Deactivated directory users should be automatically offboarded from all connected apps",
      priority: "high",
      ruleInput: {
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        conditions: template.conditions,
        actions: template.actions
      }
    });
  }
  const hasOnboardRule = existingRules.some((r) => r.triggerType === "user_created");
  if (groupMappings.length > 0 && !hasOnboardRule) {
    const template = ruleTemplates.find((t) => t.id === "onboard-new-user");
    suggestions.push({
      templateId: "onboard-new-user",
      reason: "New directory users can be auto-onboarded to mapped apps based on their group membership",
      priority: "medium",
      ruleInput: {
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        conditions: template.conditions,
        actions: template.actions
      }
    });
  }
  const hasComplianceRule = existingRules.some((r) => r.triggerType === "compliance_score_changed");
  if (!hasComplianceRule) {
    const template = ruleTemplates.find((t) => t.id === "compliance-score-drop");
    suggestions.push({
      templateId: "compliance-score-drop",
      reason: "Get alerted when compliance scores drop below safe thresholds",
      priority: "low",
      ruleInput: {
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        conditions: template.conditions,
        actions: template.actions
      }
    });
  }
  const hasSyncOnConnectRule = existingRules.some((r) => r.triggerType === "app_connected");
  if (connectedApps.length > 0 && !hasSyncOnConnectRule) {
    const template = ruleTemplates.find((t) => t.id === "sync-directory-on-app-connect");
    if (template) {
      suggestions.push({
        templateId: "sync-directory-on-app-connect",
        reason: `Automatically sync directory users when a new app is connected to keep mappings current`,
        priority: "medium",
        ruleInput: {
          name: template.name,
          description: template.description,
          triggerType: template.triggerType,
          triggerConfig: template.triggerConfig,
          conditions: template.conditions,
          actions: template.actions
        }
      });
    }
  }
  const appsWithRules = new Set(existingRules.filter((r) => r.triggerConfig?.appId).map((r) => r.triggerConfig.appId));
  for (const app of connectedApps) {
    if (appsWithRules.has(app.appId))
      continue;
    suggestions.push({
      templateId: `auto-provision-${app.appId}`,
      reason: `${app.appName} is connected but has no automation rules — set up auto-provisioning for new users`,
      priority: "medium",
      ruleInput: {
        name: `Auto-provision ${app.appName} for new users`,
        description: `When a new user is created in the directory, automatically provision their ${app.appName} account`,
        triggerType: "user_created",
        triggerConfig: { appId: app.appId },
        conditions: [],
        actions: [
          {
            type: "provision_app_access",
            config: { appId: app.appId, role: "member" },
            order: 1
          },
          {
            type: "send_notification",
            config: {
              channel: "slack",
              template: "user_provisioned",
              notifyUser: true
            },
            order: 2
          }
        ]
      }
    });
  }
  for (const s of suggestions) {
    const appName = s.ruleInput.actions?.[0]?.config?.appId;
    s.complianceImpact = getComplianceImpact(s.templateId, appName);
  }
  return suggestions.sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
}
function generatePatternSuggestions(existingRules, eventHistory) {
  const suggestions = [];
  const existingTriggerTypes = new Set(existingRules.map((r) => r.triggerType));
  const eventToTrigger = {
    "user.created": "user_created",
    "user.deactivated": "user_deactivated",
    "user.joined_group": "user_joined_group",
    "user.left_group": "user_left_group",
    "app.connected": "app_connected",
    "app.disconnected": "app_disconnected",
    "app.health_changed": "app_health_changed",
    "compliance.score_changed": "compliance_score_changed"
  };
  const triggerToTemplate = {
    user_created: "onboard-new-user",
    user_deactivated: "offboard-user-on-deactivation",
    app_health_changed: "health-degradation-alert",
    compliance_score_changed: "compliance-score-drop",
    app_connected: "sync-directory-on-app-connect"
  };
  for (const entry of eventHistory) {
    const triggerType = eventToTrigger[entry.type];
    if (!triggerType)
      continue;
    if (existingTriggerTypes.has(triggerType))
      continue;
    const templateId = triggerToTemplate[triggerType];
    if (!templateId)
      continue;
    const template = ruleTemplates.find((t) => t.id === templateId);
    if (!template)
      continue;
    if (entry.count >= 3) {
      suggestions.push({
        templateId,
        reason: `"${entry.type}" events have occurred ${entry.count} times — automate the response with a rule`,
        priority: entry.count >= 10 ? "high" : "medium",
        ruleInput: {
          name: template.name,
          description: template.description,
          triggerType: template.triggerType,
          triggerConfig: template.triggerConfig,
          conditions: template.conditions,
          actions: template.actions
        }
      });
    }
  }
  for (const s of suggestions) {
    s.complianceImpact = getComplianceImpact(s.templateId);
  }
  return suggestions.sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
}
const COMPLIANCE_IMPACTS = {
  "auto-provision-on-group-join": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF"],
    controls: [
      { id: "CC6.1", name: "Logical access security" },
      { id: "A.9.2.2", name: "User access provisioning" },
      { id: "PR.AC-1", name: "Identity & credential management" }
    ],
    reasoning: "Automated provisioning ensures access is granted through defined controls, strengthening identity lifecycle management and reducing manual provisioning errors."
  },
  "auto-revoke-on-group-leave": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF", "HIPAA"],
    controls: [
      { id: "CC6.3", name: "Access removal" },
      { id: "A.9.2.6", name: "Removal of access rights" },
      { id: "PR.AC-4", name: "Least privilege enforcement" },
      { id: "164.312(a)(1)", name: "Access control" }
    ],
    reasoning: "Automatic access revocation on group departure enforces least-privilege and ensures timely deprovisioning — a key audit requirement across all major frameworks."
  },
  "health-degradation-alert": {
    frameworks: ["SOC2", "NIST CSF"],
    controls: [
      { id: "CC7.2", name: "System monitoring" },
      { id: "DE.CM-1", name: "Network monitoring" }
    ],
    reasoning: "Health monitoring automation helps detect and respond to service disruptions, supporting continuous monitoring controls."
  },
  "offboard-user-on-deactivation": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF", "HIPAA", "GDPR"],
    controls: [
      { id: "CC6.3", name: "Access removal" },
      { id: "A.9.2.6", name: "Removal of access rights" },
      { id: "PR.AC-4", name: "Least privilege enforcement" },
      { id: "164.312(a)(1)", name: "Access control" },
      { id: "Art.17", name: "Right to erasure" }
    ],
    reasoning: "Automated offboarding is the highest-impact compliance automation — it ensures no orphaned accounts persist after user deactivation, a top finding in SOC 2 and ISO audits."
  },
  "onboard-new-user": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF"],
    controls: [
      { id: "CC6.2", name: "User registration & authorization" },
      { id: "A.9.2.1", name: "User registration & deregistration" },
      { id: "PR.AC-1", name: "Identity & credential management" }
    ],
    reasoning: "Automated onboarding ensures consistent access provisioning aligned with group-based policies, reducing risk of ad-hoc permission grants."
  },
  "compliance-score-drop": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF"],
    controls: [
      { id: "CC4.1", name: "Monitoring activities" },
      { id: "A.9.2.5", name: "Review of user access rights" },
      { id: "DE.CM-1", name: "Network monitoring" }
    ],
    reasoning: "Score-drop alerts enable proactive remediation before compliance gaps widen, supporting continuous improvement controls."
  },
  "sync-directory-on-app-connect": {
    frameworks: ["SOC2", "ISO27001"],
    controls: [
      { id: "CC6.1", name: "Logical access security" },
      { id: "A.9.2.1", name: "User registration & deregistration" }
    ],
    reasoning: "Automatic directory sync on app connection ensures user inventories stay current, reducing drift between identity provider and downstream apps."
  }
};
function getComplianceImpact(templateId, appName) {
  const impact = COMPLIANCE_IMPACTS[templateId];
  if (impact)
    return impact;
  if (templateId.startsWith("auto-provision-")) {
    return {
      frameworks: ["SOC2", "ISO27001", "NIST CSF"],
      controls: [
        { id: "CC6.2", name: "User registration & authorization" },
        { id: "A.9.2.2", name: "User access provisioning" },
        { id: "PR.AC-1", name: "Identity & credential management" }
      ],
      reasoning: `Automating ${appName || "app"} provisioning ensures consistent access grants tied to directory events, strengthening access control evidence.`
    };
  }
  return void 0;
}
function ruleKey(rule) {
  const cfg = rule.triggerConfig;
  return key(rule.triggerType, cfg.groupId, cfg.appId);
}
function key(trigger, groupId, appId) {
  return `${trigger}:${groupId ?? "*"}:${appId ?? "*"}`;
}
function priorityWeight(p) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}
const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const [
    rulesResult,
    connectedRawResult,
    mappingsSettled,
    eventHistorySettled,
    dismissedResult,
    selectedAppsResult
  ] = await Promise.allSettled([
    listRules(tenantId),
    listConnectedApps(platform, tenantId),
    queryPg(
      `SELECT m.group_id as groupId, g.name as groupName, m.app_id as appId, m.role
       FROM group_app_mappings m
       LEFT JOIN directory_groups g ON g.id = m.group_id
       WHERE m.tenant_id = $1`,
      [tenantId]
    ),
    queryPg(
      `SELECT type, source, COUNT(*) as count, MAX(created_at) as latestAt
       FROM events
       WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY type, source
       ORDER BY count DESC
       LIMIT 50`,
      [tenantId]
    ),
    listDismissedSuggestions(tenantId),
    queryPgOne(
      "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'selected_apps'",
      [tenantId]
    )
  ]);
  const warnings = [];
  const rules = rulesResult.status === "fulfilled" ? rulesResult.value : (console.error(
    JSON.stringify({
      source: "suggestions/rules",
      tenantId,
      error: String(rulesResult.reason)
    })
  ), warnings.push("rules"), []);
  const connectedRaw = connectedRawResult.status === "fulfilled" ? connectedRawResult.value : (console.error(
    JSON.stringify({
      source: "suggestions/connected-apps",
      tenantId,
      error: String(connectedRawResult.reason)
    })
  ), warnings.push("connected-apps"), []);
  const mappingsResult = mappingsSettled.status === "fulfilled" ? mappingsSettled.value : (console.error(
    JSON.stringify({
      source: "suggestions/group-mappings",
      tenantId,
      error: String(mappingsSettled.reason)
    })
  ), warnings.push("group-mappings"), []);
  const eventHistoryResult = eventHistorySettled.status === "fulfilled" ? eventHistorySettled.value : (console.error(
    JSON.stringify({
      source: "suggestions/event-history",
      tenantId,
      error: String(eventHistorySettled.reason)
    })
  ), warnings.push("event-history"), []);
  const dismissedIds = dismissedResult.status === "fulfilled" ? dismissedResult.value : (console.error(
    JSON.stringify({
      source: "suggestions/dismissed",
      tenantId,
      error: String(dismissedResult.reason)
    })
  ), warnings.push("dismissed"), []);
  let selectedApps = [];
  if (selectedAppsResult.status === "fulfilled" && selectedAppsResult.value?.value) {
    try {
      selectedApps = JSON.parse(selectedAppsResult.value.value);
    } catch {
    }
  }
  const tenantEcosystem = new Set(selectedApps);
  const allConnected = connectedRaw.map((c) => ({
    appId: c.app_id,
    appName: integrations.find((i) => i.id === c.app_id)?.name ?? c.app_id,
    healthy: c.healthy
  }));
  const connectedApps = tenantEcosystem.size > 0 ? allConnected.filter((a) => tenantEcosystem.has(a.appId)) : allConnected;
  const relevantAppIds = new Set(connectedApps.map((a) => a.appId));
  const groupMappings = (mappingsResult || []).filter((r) => relevantAppIds.has(r.appId)).map((r) => ({
    groupId: r.groupId,
    groupName: r.groupName || r.groupId,
    appId: r.appId,
    role: r.role || "member"
  }));
  const eventHistory = (eventHistoryResult || []).map((r) => ({
    type: r.type,
    source: r.source,
    count: r.count,
    latestAt: r.latestAt
  }));
  const stateSuggestions = generateSuggestions(rules, connectedApps, groupMappings);
  const patternSuggestions = generatePatternSuggestions(rules, eventHistory);
  const seen = new Set(stateSuggestions.map((s) => s.templateId));
  const dismissedSet = new Set(dismissedIds);
  const merged = [
    ...stateSuggestions,
    ...patternSuggestions.filter((s) => !seen.has(s.templateId))
  ].filter((s) => !dismissedSet.has(s.templateId));
  const response = {
    suggestions: merged
  };
  if (warnings.length > 0) response.warnings = warnings;
  return json(response);
};
const POST = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
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

export { GET, POST };
//# sourceMappingURL=_server.ts-ChNvUZpf.js.map
