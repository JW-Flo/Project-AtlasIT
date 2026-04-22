import { A as ACTION_COMPLIANCE_MAP } from './gap-analyzer-CVZTZ0l9.js';

function evaluateConditions(conditions, payload) {
  if (conditions.length === 0)
    return true;
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
        return Array.isArray(condition.value) && condition.value.includes(String(fieldValue));
      case "not_in":
        return Array.isArray(condition.value) && !condition.value.includes(String(fieldValue));
      case "gt":
        return Number(fieldValue) > Number(condition.value);
      case "lt":
        return Number(fieldValue) < Number(condition.value);
      default:
        return false;
    }
  });
}
function matchRules(rules, event) {
  return rules.filter((rule) => {
    if (!rule.enabled)
      return false;
    if (rule.triggerType !== event.type)
      return false;
    if (!matchesTriggerConfig(rule, event))
      return false;
    return evaluateConditions(rule.conditions, event.payload);
  });
}
function sortActions(actions) {
  return [...actions].sort((a, b) => a.order - b.order);
}
function interpolateTemplate(template, payload) {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path) => {
    const value = getNestedValue(payload, path);
    return value !== void 0 ? String(value) : `{{${path}}}`;
  });
}
function buildExecutionSummary(rule, results, durationMs) {
  const actionsRun = results.length;
  const actionsFailed = results.filter((r) => r.status === "failed").length;
  let status;
  if (actionsFailed === 0) {
    status = "success";
  } else if (actionsFailed < actionsRun) {
    status = "partial";
  } else {
    status = "failed";
  }
  return { status, actionsRun, actionsFailed, durationMs };
}
function evaluateConditionDetailed(condition, payload) {
  const actual = getNestedValue(payload, condition.field);
  let passed;
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
      passed = Array.isArray(condition.value) && condition.value.includes(String(actual));
      break;
    case "not_in":
      passed = Array.isArray(condition.value) && !condition.value.includes(String(actual));
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
    passed
  };
}
const ACTION_DESCRIPTION_TEMPLATES = {
  provision_app_access: "Provision access to {{appId}}",
  revoke_app_access: "Revoke access to {{appId}}",
  send_notification: "Send notification: {{message}}",
  run_workflow: "Run {{workflowType}} workflow",
  assign_role: "Assign role {{role}}",
  remove_role: "Remove role {{role}}",
  sync_directory: "Sync directory",
  create_incident: "Create incident: {{title}}",
  update_compliance_status: "Update compliance status for {{framework}}",
  request_access_review: "Request access review for {{userId}}"
};
function simulateRule(rule, event) {
  const triggerMatch = rule.triggerType === event.type && matchesTriggerConfig(rule, event);
  const conditionResults = rule.conditions.map((condition) => evaluateConditionDetailed(condition, event.payload));
  const allConditionsPassed = conditionResults.length === 0 || conditionResults.every((r) => r.passed);
  const triggered = triggerMatch && allConditionsPassed;
  const sortedActions = sortActions(rule.actions);
  const actionsPreview = sortedActions.map((action) => {
    const interpolated = {};
    for (const [key, val] of Object.entries(action.config)) {
      interpolated[key] = interpolateTemplate(String(val), event.payload);
    }
    const descTemplate = ACTION_DESCRIPTION_TEMPLATES[action.type] ?? `Execute ${action.type} action`;
    const configAsStrings = { ...action.config };
    const description = interpolateTemplate(descTemplate, {
      ...event.payload,
      ...configAsStrings
    });
    return {
      type: action.type,
      order: action.order,
      config: action.config,
      interpolated,
      description
    };
  });
  const frameworkMap = /* @__PURE__ */ new Map();
  for (const action of sortedActions) {
    const controls = ACTION_COMPLIANCE_MAP[action.type] ?? [];
    for (const control of controls) {
      if (!frameworkMap.has(control.framework)) {
        frameworkMap.set(control.framework, /* @__PURE__ */ new Map());
      }
      frameworkMap.get(control.framework).set(control.controlId, control.controlName);
    }
  }
  const complianceImpact = Array.from(frameworkMap.entries()).map(([framework, controlsMap]) => ({
    framework,
    controls: Array.from(controlsMap.entries()).map(([id, name]) => ({
      id,
      name
    }))
  }));
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    enabled: rule.enabled,
    triggered,
    triggerMatch,
    conditionResults,
    actionsPreview,
    complianceImpact
  };
}
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return current[key];
    }
    return void 0;
  }, obj);
}
function matchesTriggerConfig(rule, event) {
  const config = rule.triggerConfig;
  const payload = event.payload;
  if (config.groupId && payload.groupId !== config.groupId)
    return false;
  if (config.groupName && payload.groupName !== config.groupName)
    return false;
  if (config.appId && payload.appId !== config.appId)
    return false;
  if (config.threshold !== void 0 && config.direction) {
    const score = Number(payload.score);
    if (config.direction === "below" && score >= config.threshold)
      return false;
    if (config.direction === "above" && score <= config.threshold)
      return false;
  }
  return true;
}

export { simulateRule as a, buildExecutionSummary as b, interpolateTemplate as i, matchRules as m, sortActions as s };
//# sourceMappingURL=engine-CzA3W71_.js.map
