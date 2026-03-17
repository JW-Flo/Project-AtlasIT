/**
 * Evaluate whether a rule's conditions match a given event payload.
 * All conditions must pass (AND logic).
 */
export function evaluateConditions(conditions, payload) {
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
                return (Array.isArray(condition.value) &&
                    condition.value.includes(String(fieldValue)));
            case "not_in":
                return (Array.isArray(condition.value) &&
                    !condition.value.includes(String(fieldValue)));
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
export function matchRules(rules, event) {
    return rules.filter((rule) => {
        if (!rule.enabled)
            return false;
        if (rule.triggerType !== event.type)
            return false;
        // Check trigger-specific config matches
        if (!matchesTriggerConfig(rule, event))
            return false;
        // Check conditions against event payload
        return evaluateConditions(rule.conditions, event.payload);
    });
}
/**
 * Sort actions by their execution order.
 */
export function sortActions(actions) {
    return [...actions].sort((a, b) => a.order - b.order);
}
/**
 * Interpolate template strings like {{user.email}} with event payload values.
 */
export function interpolateTemplate(template, payload) {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path) => {
        const value = getNestedValue(payload, path);
        return value !== undefined ? String(value) : `{{${path}}}`;
    });
}
/**
 * Build a summary of automation execution for audit logging.
 */
export function buildExecutionSummary(rule, results, durationMs) {
    const actionsRun = results.length;
    const actionsFailed = results.filter((r) => r.status === "failed").length;
    let status;
    if (actionsFailed === 0) {
        status = "success";
    }
    else if (actionsFailed < actionsRun) {
        status = "partial";
    }
    else {
        status = "failed";
    }
    return { status, actionsRun, actionsFailed, durationMs };
}
// --- Internal helpers ---
function getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
        if (current &&
            typeof current === "object" &&
            key in current) {
            return current[key];
        }
        return undefined;
    }, obj);
}
function matchesTriggerConfig(rule, event) {
    const config = rule.triggerConfig;
    const payload = event.payload;
    // If the rule targets a specific group, the event must match
    if (config.groupId && payload.groupId !== config.groupId)
        return false;
    if (config.groupName && payload.groupName !== config.groupName)
        return false;
    // If the rule targets a specific app, the event must match
    if (config.appId && payload.appId !== config.appId)
        return false;
    // Compliance threshold check
    if (config.threshold !== undefined && config.direction) {
        const score = Number(payload.score);
        if (config.direction === "below" && score >= config.threshold)
            return false;
        if (config.direction === "above" && score <= config.threshold)
            return false;
    }
    return true;
}
//# sourceMappingURL=engine.js.map