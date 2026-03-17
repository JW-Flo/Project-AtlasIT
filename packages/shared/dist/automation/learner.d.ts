import type { AutomationRule, CreateRuleInput } from "./types";
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
 * Analyze tenant state and generate automation rule suggestions.
 *
 * The learner does NOT persist anything — it returns suggestions that the
 * caller (API route or event handler) can present to the tenant or auto-apply.
 */
export declare function generateSuggestions(
  existingRules: AutomationRule[],
  connectedApps: ConnectedApp[],
  groupMappings: GroupAppMapping[],
): AutomationSuggestion[];
export {};
//# sourceMappingURL=learner.d.ts.map
