import type {
  AutomationRule,
  CreateRuleInput,
  RuleTemplate,
  TriggerType,
} from "./types";
import { ruleTemplates } from "./templates";

/**
 * Mapping between a directory group and an app (mirrors group_app_mappings table).
 */
interface GroupAppMapping {
  groupId: string;
  groupName: string;
  appId: string;
  role: string;
}

/**
 * Connected app summary used for suggestion generation.
 */
interface ConnectedApp {
  appId: string;
  appName: string;
  healthy: boolean;
}

/**
 * Compliance impact metadata for a suggestion.
 */
export interface ComplianceImpact {
  frameworks: string[];
  controls: { id: string; name: string }[];
  reasoning: string;
}

/**
 * Suggestion returned by the learner with a reason and a ready-to-create rule input.
 */
export interface AutomationSuggestion {
  templateId: string;
  reason: string;
  priority: "high" | "medium" | "low";
  ruleInput: CreateRuleInput;
  complianceImpact?: ComplianceImpact;
}

/**
 * A summary of a historical event from the events table.
 */
export interface EventHistoryEntry {
  type: string;
  source: string;
  count: number;
  latestAt: string;
}

/**
 * Analyze tenant state and generate automation rule suggestions.
 *
 * The learner does NOT persist anything — it returns suggestions that the
 * caller (API route or event handler) can present to the tenant or auto-apply.
 */
export function generateSuggestions(
  existingRules: AutomationRule[],
  connectedApps: ConnectedApp[],
  groupMappings: GroupAppMapping[],
): AutomationSuggestion[] {
  const suggestions: AutomationSuggestion[] = [];
  const existingTriggers = new Set(existingRules.map(ruleKey));
  const connectedAppIds = new Set(connectedApps.map((a) => a.appId));

  // 1. For each group↔app mapping without a provisioning rule, suggest auto-provision
  for (const mapping of groupMappings) {
    if (!connectedAppIds.has(mapping.appId)) continue;
    const provisionKey = key(
      "user_joined_group",
      mapping.groupId,
      mapping.appId,
    );
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
            appId: mapping.appId,
          },
          conditions: [],
          actions: [
            {
              type: "provision_app_access",
              config: {
                appId: mapping.appId,
                role: mapping.role,
                groupId: mapping.groupId,
              },
              order: 1,
            },
            {
              type: "send_notification",
              config: {
                channel: "slack",
                template: "user_provisioned",
                notifyUser: true,
              },
              order: 2,
            },
          ],
        },
      });
    }

    // Also suggest the mirror revoke rule
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
            appId: mapping.appId,
          },
          conditions: [],
          actions: [
            {
              type: "revoke_app_access",
              config: { appId: mapping.appId, groupId: mapping.groupId },
              order: 1,
            },
            {
              type: "send_notification",
              config: {
                channel: "slack",
                template: "user_deprovisioned",
                notifyAdmin: true,
              },
              order: 2,
            },
          ],
        },
      });
    }
  }

  // 2. If there are connected apps but no health alert rule, suggest one
  const hasHealthRule = existingRules.some(
    (r) => r.triggerType === "app_health_changed",
  );
  if (connectedApps.length > 0 && !hasHealthRule) {
    const template = ruleTemplates.find(
      (t) => t.id === "health-degradation-alert",
    )!;
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
        actions: template.actions,
      },
    });
  }

  // 3. If no offboarding rule exists, suggest one
  const hasOffboardRule = existingRules.some(
    (r) => r.triggerType === "user_deactivated",
  );
  if (connectedApps.length > 0 && !hasOffboardRule) {
    const template = ruleTemplates.find(
      (t) => t.id === "offboard-user-on-deactivation",
    )!;
    suggestions.push({
      templateId: "offboard-user-on-deactivation",
      reason:
        "Deactivated directory users should be automatically offboarded from all connected apps",
      priority: "high",
      ruleInput: {
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        conditions: template.conditions,
        actions: template.actions,
      },
    });
  }

  // 4. If no onboarding rule exists and there are mappings, suggest one
  const hasOnboardRule = existingRules.some(
    (r) => r.triggerType === "user_created",
  );
  if (groupMappings.length > 0 && !hasOnboardRule) {
    const template = ruleTemplates.find((t) => t.id === "onboard-new-user")!;
    suggestions.push({
      templateId: "onboard-new-user",
      reason:
        "New directory users can be auto-onboarded to mapped apps based on their group membership",
      priority: "medium",
      ruleInput: {
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        conditions: template.conditions,
        actions: template.actions,
      },
    });
  }

  // 5. If no compliance monitoring rule exists, suggest one
  const hasComplianceRule = existingRules.some(
    (r) => r.triggerType === "compliance_score_changed",
  );
  if (!hasComplianceRule) {
    const template = ruleTemplates.find(
      (t) => t.id === "compliance-score-drop",
    )!;
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
        actions: template.actions,
      },
    });
  }

  // 6. If there are connected apps but no directory sync on connect rule, suggest one
  const hasSyncOnConnectRule = existingRules.some(
    (r) => r.triggerType === "app_connected",
  );
  if (connectedApps.length > 0 && !hasSyncOnConnectRule) {
    const template = ruleTemplates.find(
      (t) => t.id === "sync-directory-on-app-connect",
    );
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
          actions: template.actions,
        },
      });
    }
  }

  // 7. Per-app provisioning suggestions for connected apps without any rules
  const appsWithRules = new Set(
    existingRules
      .filter((r) => r.triggerConfig?.appId)
      .map((r) => r.triggerConfig.appId),
  );
  for (const app of connectedApps) {
    if (appsWithRules.has(app.appId)) continue;
    // Suggest auto-provisioning for each connected app without any automation
    suggestions.push({
      templateId: `auto-provision-${app.appId}`,
      reason: `${app.appName} is connected but has no automation rules — set up auto-provisioning for new users`,
      priority: "medium",
      ruleInput: {
        name: `Auto-provision ${app.appName} for new users`,
        description: `When a new user is created in the directory, automatically provision their ${app.appName} account`,
        triggerType: "user_created" as TriggerType,
        triggerConfig: { appId: app.appId },
        conditions: [],
        actions: [
          {
            type: "provision_app_access",
            config: { appId: app.appId, role: "member" },
            order: 1,
          },
          {
            type: "send_notification",
            config: {
              channel: "slack",
              template: "user_provisioned",
              notifyUser: true,
            },
            order: 2,
          },
        ],
      },
    });
  }

  // Attach compliance impact to all suggestions
  for (const s of suggestions) {
    const appName = s.ruleInput.actions?.[0]?.config?.appId as string | undefined;
    s.complianceImpact = getComplianceImpact(s.templateId, appName);
  }

  return suggestions.sort(
    (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority),
  );
}

/**
 * Analyze event history to detect patterns and generate data-driven suggestions.
 *
 * Looks for:
 * - Frequently occurring events without matching automation rules
 * - Event types that map to supported triggers but have no rules
 */
export function generatePatternSuggestions(
  existingRules: AutomationRule[],
  eventHistory: EventHistoryEntry[],
): AutomationSuggestion[] {
  const suggestions: AutomationSuggestion[] = [];
  const existingTriggerTypes = new Set(existingRules.map((r) => r.triggerType));

  /** Map from D1 event types to automation trigger types */
  const eventToTrigger: Record<string, TriggerType> = {
    "user.created": "user_created",
    "user.deactivated": "user_deactivated",
    "user.joined_group": "user_joined_group",
    "user.left_group": "user_left_group",
    "app.connected": "app_connected",
    "app.disconnected": "app_disconnected",
    "app.health_changed": "app_health_changed",
    "compliance.score_changed": "compliance_score_changed",
  };

  const triggerToTemplate: Record<string, string> = {
    user_created: "onboard-new-user",
    user_deactivated: "offboard-user-on-deactivation",
    app_health_changed: "health-degradation-alert",
    compliance_score_changed: "compliance-score-drop",
    app_connected: "sync-directory-on-app-connect",
  };

  for (const entry of eventHistory) {
    const triggerType = eventToTrigger[entry.type];
    if (!triggerType) continue;
    if (existingTriggerTypes.has(triggerType)) continue;

    const templateId = triggerToTemplate[triggerType];
    if (!templateId) continue;

    const template = ruleTemplates.find((t) => t.id === templateId);
    if (!template) continue;

    // Suggest if the event occurs frequently (3+ times)
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
          actions: template.actions,
        },
      });
    }
  }

  for (const s of suggestions) {
    s.complianceImpact = getComplianceImpact(s.templateId);
  }

  return suggestions.sort(
    (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority),
  );
}

// --- Compliance impact mappings ---

const COMPLIANCE_IMPACTS: Record<string, ComplianceImpact> = {
  "auto-provision-on-group-join": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF"],
    controls: [
      { id: "CC6.1", name: "Logical access security" },
      { id: "A.9.2.2", name: "User access provisioning" },
      { id: "PR.AC-1", name: "Identity & credential management" },
    ],
    reasoning: "Automated provisioning ensures access is granted through defined controls, strengthening identity lifecycle management and reducing manual provisioning errors.",
  },
  "auto-revoke-on-group-leave": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF", "HIPAA"],
    controls: [
      { id: "CC6.3", name: "Access removal" },
      { id: "A.9.2.6", name: "Removal of access rights" },
      { id: "PR.AC-4", name: "Least privilege enforcement" },
      { id: "164.312(a)(1)", name: "Access control" },
    ],
    reasoning: "Automatic access revocation on group departure enforces least-privilege and ensures timely deprovisioning — a key audit requirement across all major frameworks.",
  },
  "health-degradation-alert": {
    frameworks: ["SOC2", "NIST CSF"],
    controls: [
      { id: "CC7.2", name: "System monitoring" },
      { id: "DE.CM-1", name: "Network monitoring" },
    ],
    reasoning: "Health monitoring automation helps detect and respond to service disruptions, supporting continuous monitoring controls.",
  },
  "offboard-user-on-deactivation": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF", "HIPAA", "GDPR"],
    controls: [
      { id: "CC6.3", name: "Access removal" },
      { id: "A.9.2.6", name: "Removal of access rights" },
      { id: "PR.AC-4", name: "Least privilege enforcement" },
      { id: "164.312(a)(1)", name: "Access control" },
      { id: "Art.17", name: "Right to erasure" },
    ],
    reasoning: "Automated offboarding is the highest-impact compliance automation — it ensures no orphaned accounts persist after user deactivation, a top finding in SOC 2 and ISO audits.",
  },
  "onboard-new-user": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF"],
    controls: [
      { id: "CC6.2", name: "User registration & authorization" },
      { id: "A.9.2.1", name: "User registration & deregistration" },
      { id: "PR.AC-1", name: "Identity & credential management" },
    ],
    reasoning: "Automated onboarding ensures consistent access provisioning aligned with group-based policies, reducing risk of ad-hoc permission grants.",
  },
  "compliance-score-drop": {
    frameworks: ["SOC2", "ISO27001", "NIST CSF"],
    controls: [
      { id: "CC4.1", name: "Monitoring activities" },
      { id: "A.9.2.5", name: "Review of user access rights" },
      { id: "DE.CM-1", name: "Network monitoring" },
    ],
    reasoning: "Score-drop alerts enable proactive remediation before compliance gaps widen, supporting continuous improvement controls.",
  },
  "sync-directory-on-app-connect": {
    frameworks: ["SOC2", "ISO27001"],
    controls: [
      { id: "CC6.1", name: "Logical access security" },
      { id: "A.9.2.1", name: "User registration & deregistration" },
    ],
    reasoning: "Automatic directory sync on app connection ensures user inventories stay current, reducing drift between identity provider and downstream apps.",
  },
};

function getComplianceImpact(templateId: string, appName?: string): ComplianceImpact | undefined {
  // Check exact match first, then strip app-specific prefix
  const impact = COMPLIANCE_IMPACTS[templateId];
  if (impact) return impact;

  // Per-app provisioning suggestions
  if (templateId.startsWith("auto-provision-")) {
    return {
      frameworks: ["SOC2", "ISO27001", "NIST CSF"],
      controls: [
        { id: "CC6.2", name: "User registration & authorization" },
        { id: "A.9.2.2", name: "User access provisioning" },
        { id: "PR.AC-1", name: "Identity & credential management" },
      ],
      reasoning: `Automating ${appName || "app"} provisioning ensures consistent access grants tied to directory events, strengthening access control evidence.`,
    };
  }

  return undefined;
}

// --- Helpers ---

function ruleKey(rule: AutomationRule): string {
  const cfg = rule.triggerConfig;
  return key(rule.triggerType, cfg.groupId, cfg.appId);
}

function key(trigger: TriggerType, groupId?: string, appId?: string): string {
  return `${trigger}:${groupId ?? "*"}:${appId ?? "*"}`;
}

function priorityWeight(p: "high" | "medium" | "low"): number {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}
