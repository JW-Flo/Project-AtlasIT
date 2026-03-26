import type {
  AutomationRule,
  AutomationEvent,
  RuleCondition,
  ActionResult,
  RuleAction,
  AutomationExecution,
  ConditionResult,
  ActionPreview,
  SimulationResult,
} from "./types";
import { ACTION_COMPLIANCE_MAP } from "./compliance-mapping";

/**
 * Evaluate whether a rule's conditions match a given event payload.
 * All conditions must pass (AND logic).
 */
export function evaluateConditions(
  conditions: RuleCondition[],
  payload: Record<string, unknown>,
): boolean {
  if (conditions.length === 0) return true;

  return conditions.every((condition) => {
    const fieldValue = getNestedValue(payload, condition.field);

    switch (condition.operator) {
      case "equals":
        return String(fieldValue) === String(condition.value);
      case "not_equals":
        return String(fieldValue) !== String(condition.value);
      case "contains":
        return String(fieldValue).includes(String(condition.value));
      case "in":
        return (
          Array.isArray(condition.value) &&
          condition.value.includes(String(fieldValue))
        );
      case "not_in":
        return (
          Array.isArray(condition.value) &&
          !condition.value.includes(String(fieldValue))
        );
      case "gt":
        return Number(fieldValue) > Number(condition.value);
      case "lt":
        return Number(fieldValue) < Number(condition.value);
      default:
        return false;
    }
  });
}

/**
 * Match an event against a list of rules to find which ones should fire.
 */
export function matchRules(
  rules: AutomationRule[],
  event: AutomationEvent,
): AutomationRule[] {
  return rules.filter((rule) => {
    if (!rule.enabled) return false;
    if (rule.triggerType !== event.type) return false;

    // Check trigger-specific config matches
    if (!matchesTriggerConfig(rule, event)) return false;

    // Check conditions against event payload
    return evaluateConditions(rule.conditions, event.payload);
  });
}

/**
 * Sort actions by their execution order.
 */
export function sortActions(actions: RuleAction[]): RuleAction[] {
  return [...actions].sort((a, b) => a.order - b.order);
}

/**
 * Interpolate template strings like {{user.email}} with event payload values.
 */
export function interpolateTemplate(
  template: string,
  payload: Record<string, unknown>,
): string {
  return template.replace(
    /\{\{(\w+(?:\.\w+)*)\}\}/g,
    (_match, path: string) => {
      const value = getNestedValue(payload, path);
      return value !== undefined ? String(value) : `{{${path}}}`;
    },
  );
}

/**
 * Build a summary of automation execution for audit logging.
 */
export function buildExecutionSummary(
  rule: AutomationRule,
  results: ActionResult[],
  durationMs: number,
): Pick<
  AutomationExecution,
  "status" | "actionsRun" | "actionsFailed" | "durationMs"
> {
  const actionsRun = results.length;
  const actionsFailed = results.filter((r) => r.status === "failed").length;

  let status: AutomationExecution["status"];
  if (actionsFailed === 0) {
    status = "success";
  } else if (actionsFailed < actionsRun) {
    status = "partial";
  } else {
    status = "failed";
  }

  return { status, actionsRun, actionsFailed, durationMs };
}

/**
 * Evaluate a single condition and return detailed pass/fail information
 * including the actual value observed vs. the expected value.
 */
export function evaluateConditionDetailed(
  condition: RuleCondition,
  payload: Record<string, unknown>,
): ConditionResult {
  const actual = getNestedValue(payload, condition.field);

  let passed: boolean;
  switch (condition.operator) {
    case "equals":
      passed = String(actual) === String(condition.value);
      break;
    case "not_equals":
      passed = String(actual) !== String(condition.value);
      break;
    case "contains":
      passed = String(actual).includes(String(condition.value));
      break;
    case "in":
      passed =
        Array.isArray(condition.value) &&
        condition.value.includes(String(actual));
      break;
    case "not_in":
      passed =
        Array.isArray(condition.value) &&
        !condition.value.includes(String(actual));
      break;
    case "gt":
      passed = Number(actual) > Number(condition.value);
      break;
    case "lt":
      passed = Number(actual) < Number(condition.value);
      break;
    default:
      passed = false;
  }

  return {
    field: condition.field,
    operator: condition.operator,
    expected: condition.value,
    actual,
    passed,
  };
}

const ACTION_DESCRIPTION_TEMPLATES: Record<string, string> = {
  provision_app_access: "Provision access to {{appId}}",
  revoke_app_access: "Revoke access to {{appId}}",
  send_notification: "Send notification: {{message}}",
  run_workflow: "Run {{workflowType}} workflow",
  assign_role: "Assign role {{role}}",
  remove_role: "Remove role {{role}}",
  sync_directory: "Sync directory",
  create_incident: "Create incident: {{title}}",
  update_compliance_status: "Update compliance status for {{framework}}",
  request_access_review: "Request access review for {{userId}}",
};

/**
 * Simulate a rule against an event without executing any actions.
 * Returns a full preview of what would happen including condition results,
 * interpolated action configs, and compliance impact.
 */
export function simulateRule(
  rule: AutomationRule,
  event: AutomationEvent,
): SimulationResult {
  const triggerMatch = rule.triggerType === event.type && matchesTriggerConfig(rule, event);

  const conditionResults = rule.conditions.map((condition) =>
    evaluateConditionDetailed(condition, event.payload),
  );

  const allConditionsPassed =
    conditionResults.length === 0 || conditionResults.every((r) => r.passed);
  const triggered = triggerMatch && allConditionsPassed;

  const sortedActions = sortActions(rule.actions);

  const actionsPreview: ActionPreview[] = sortedActions.map((action) => {
    const interpolated: Record<string, string> = {};
    for (const [key, val] of Object.entries(action.config)) {
      interpolated[key] = interpolateTemplate(String(val), event.payload);
    }

    const descTemplate =
      ACTION_DESCRIPTION_TEMPLATES[action.type] ??
      `Execute ${action.type} action`;
    const configAsStrings: Record<string, unknown> = { ...action.config };
    const description = interpolateTemplate(descTemplate, {
      ...event.payload,
      ...configAsStrings,
    });

    return {
      type: action.type,
      order: action.order,
      config: action.config,
      interpolated,
      description,
    };
  });

  // Build compliance impact grouped by framework
  const frameworkMap = new Map<string, Map<string, string>>();
  for (const action of sortedActions) {
    const controls = ACTION_COMPLIANCE_MAP[action.type] ?? [];
    for (const control of controls) {
      if (!frameworkMap.has(control.framework)) {
        frameworkMap.set(control.framework, new Map());
      }
      frameworkMap.get(control.framework)!.set(control.controlId, control.controlName);
    }
  }

  const complianceImpact = Array.from(frameworkMap.entries()).map(
    ([framework, controlsMap]) => ({
      framework,
      controls: Array.from(controlsMap.entries()).map(([id, name]) => ({
        id,
        name,
      })),
    }),
  );

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    triggered,
    triggerMatch,
    conditionResults,
    actionsPreview,
    complianceImpact,
  };
}

// --- Internal helpers ---

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === "object" &&
      key in (current as Record<string, unknown>)
    ) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function matchesTriggerConfig(
  rule: AutomationRule,
  event: AutomationEvent,
): boolean {
  const config = rule.triggerConfig;
  const payload = event.payload;

  // If the rule targets a specific group, the event must match
  if (config.groupId && payload.groupId !== config.groupId) return false;
  if (config.groupName && payload.groupName !== config.groupName) return false;

  // If the rule targets a specific app, the event must match
  if (config.appId && payload.appId !== config.appId) return false;

  // Compliance threshold check
  if (config.threshold !== undefined && config.direction) {
    const score = Number(payload.score);
    if (config.direction === "below" && score >= config.threshold) return false;
    if (config.direction === "above" && score <= config.threshold) return false;
  }

  return true;
}
