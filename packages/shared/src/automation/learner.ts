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
 * Suggestion returned by the learner with a reason and a ready-to-create rule input.
 */
export interface AutomationSuggestion {
  templateId: string;
  reason: string;
  priority: "high" | "medium" | "low";
  ruleInput: CreateRuleInput;
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

  // 1. For each group↔app mapping without a provisioning rule, suggest auto-provision
  for (const mapping of groupMappings) {
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

  return suggestions.sort(
    (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority),
  );
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
