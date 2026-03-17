import { ruleTemplates } from "./templates";
/**
 * Analyze tenant state and generate automation rule suggestions.
 *
 * The learner does NOT persist anything — it returns suggestions that the
 * caller (API route or event handler) can present to the tenant or auto-apply.
 */
export function generateSuggestions(
  existingRules,
  connectedApps,
  groupMappings,
) {
  const suggestions = [];
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
    );
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
    );
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
    const template = ruleTemplates.find((t) => t.id === "onboard-new-user");
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
    );
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
// --- Helpers ---
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
//# sourceMappingURL=learner.js.map
