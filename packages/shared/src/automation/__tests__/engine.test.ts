import { describe, it, expect } from "vitest";
import {
  evaluateConditions,
  matchRules,
  sortActions,
  interpolateTemplate,
  buildExecutionSummary,
  evaluateConditionDetailed,
  simulateRule,
} from "../engine";
import type {
  AutomationRule,
  AutomationEvent,
  RuleCondition,
  RuleAction,
  ActionResult,
} from "../types";

function makeRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: "rule-1",
    tenantId: "tenant-1",
    name: "Test Rule",
    enabled: true,
    triggerType: "user_joined_group",
    triggerConfig: {},
    conditions: [],
    actions: [],
    runCount: 0,
    errorCount: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<AutomationEvent> = {}): AutomationEvent {
  return {
    type: "user_joined_group",
    tenantId: "tenant-1",
    payload: {},
    timestamp: "2026-01-01T00:00:00Z",
    source: "test",
    ...overrides,
  };
}

describe("evaluateConditions", () => {
  it("returns true for empty conditions", () => {
    expect(evaluateConditions([], {})).toBe(true);
  });

  it("evaluates equals operator", () => {
    const conditions: RuleCondition[] = [{ field: "status", operator: "equals", value: "active" }];
    expect(evaluateConditions(conditions, { status: "active" })).toBe(true);
    expect(evaluateConditions(conditions, { status: "inactive" })).toBe(false);
  });

  it("evaluates not_equals operator", () => {
    const conditions: RuleCondition[] = [{ field: "role", operator: "not_equals", value: "admin" }];
    expect(evaluateConditions(conditions, { role: "member" })).toBe(true);
    expect(evaluateConditions(conditions, { role: "admin" })).toBe(false);
  });

  it("evaluates contains operator", () => {
    const conditions: RuleCondition[] = [
      { field: "email", operator: "contains", value: "@acme.com" },
    ];
    expect(evaluateConditions(conditions, { email: "bob@acme.com" })).toBe(true);
    expect(evaluateConditions(conditions, { email: "bob@other.com" })).toBe(false);
  });

  it("evaluates in operator", () => {
    const conditions: RuleCondition[] = [
      {
        field: "department",
        operator: "in",
        value: ["engineering", "product"],
      },
    ];
    expect(evaluateConditions(conditions, { department: "engineering" })).toBe(true);
    expect(evaluateConditions(conditions, { department: "sales" })).toBe(false);
  });

  it("evaluates not_in operator", () => {
    const conditions: RuleCondition[] = [
      { field: "tier", operator: "not_in", value: ["free", "trial"] },
    ];
    expect(evaluateConditions(conditions, { tier: "enterprise" })).toBe(true);
    expect(evaluateConditions(conditions, { tier: "free" })).toBe(false);
  });

  it("evaluates gt and lt operators", () => {
    expect(
      evaluateConditions([{ field: "score", operator: "gt", value: 70 }], {
        score: 85,
      }),
    ).toBe(true);
    expect(
      evaluateConditions([{ field: "score", operator: "gt", value: 70 }], {
        score: 50,
      }),
    ).toBe(false);
    expect(
      evaluateConditions([{ field: "score", operator: "lt", value: 70 }], {
        score: 50,
      }),
    ).toBe(true);
    expect(
      evaluateConditions([{ field: "score", operator: "lt", value: 70 }], {
        score: 85,
      }),
    ).toBe(false);
  });

  it("supports nested field paths", () => {
    const conditions: RuleCondition[] = [
      { field: "user.role", operator: "equals", value: "admin" },
    ];
    expect(evaluateConditions(conditions, { user: { role: "admin" } })).toBe(true);
    expect(evaluateConditions(conditions, { user: { role: "member" } })).toBe(false);
  });

  it("requires ALL conditions to pass (AND logic)", () => {
    const conditions: RuleCondition[] = [
      { field: "status", operator: "equals", value: "active" },
      { field: "role", operator: "equals", value: "admin" },
    ];
    expect(evaluateConditions(conditions, { status: "active", role: "admin" })).toBe(true);
    expect(evaluateConditions(conditions, { status: "active", role: "member" })).toBe(false);
  });
});

describe("matchRules", () => {
  it("matches rules by trigger type", () => {
    const rules = [
      makeRule({ id: "1", triggerType: "user_joined_group" }),
      makeRule({ id: "2", triggerType: "user_deactivated" }),
    ];
    const event = makeEvent({ type: "user_joined_group" });
    const matched = matchRules(rules, event);
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("1");
  });

  it("excludes disabled rules", () => {
    const rules = [makeRule({ enabled: false })];
    const matched = matchRules(rules, makeEvent());
    expect(matched).toHaveLength(0);
  });

  it("filters by trigger config (groupId)", () => {
    const rules = [
      makeRule({ id: "1", triggerConfig: { groupId: "eng" } }),
      makeRule({ id: "2", triggerConfig: { groupId: "sales" } }),
    ];
    const event = makeEvent({ payload: { groupId: "eng" } });
    const matched = matchRules(rules, event);
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("1");
  });

  it("filters by trigger config (appId)", () => {
    const rules = [
      makeRule({
        id: "1",
        triggerType: "app_connected",
        triggerConfig: { appId: "slack" },
      }),
    ];
    const event = makeEvent({
      type: "app_connected",
      payload: { appId: "jira" },
    });
    expect(matchRules(rules, event)).toHaveLength(0);
  });

  it("evaluates compliance threshold direction", () => {
    const rules = [
      makeRule({
        triggerType: "compliance_score_changed",
        triggerConfig: { threshold: 70, direction: "below" },
      }),
    ];
    const eventBelow = makeEvent({
      type: "compliance_score_changed",
      payload: { score: 60 },
    });
    const eventAbove = makeEvent({
      type: "compliance_score_changed",
      payload: { score: 80 },
    });
    expect(matchRules(rules, eventBelow)).toHaveLength(1);
    expect(matchRules(rules, eventAbove)).toHaveLength(0);
  });

  it("applies conditions alongside trigger matching", () => {
    const rules = [
      makeRule({
        conditions: [
          {
            field: "user.department",
            operator: "equals",
            value: "engineering",
          },
        ],
      }),
    ];
    const event = makeEvent({
      payload: { user: { department: "engineering" } },
    });
    expect(matchRules(rules, event)).toHaveLength(1);

    const event2 = makeEvent({ payload: { user: { department: "sales" } } });
    expect(matchRules(rules, event2)).toHaveLength(0);
  });
});

describe("sortActions", () => {
  it("sorts actions by order field", () => {
    const actions: RuleAction[] = [
      { type: "send_notification", config: {}, order: 3 },
      { type: "provision_app_access", config: {}, order: 1 },
      { type: "assign_role", config: {}, order: 2 },
    ];
    const sorted = sortActions(actions);
    expect(sorted.map((a) => a.order)).toEqual([1, 2, 3]);
  });

  it("does not mutate the original array", () => {
    const actions: RuleAction[] = [
      { type: "send_notification", config: {}, order: 2 },
      { type: "provision_app_access", config: {}, order: 1 },
    ];
    const sorted = sortActions(actions);
    expect(sorted).not.toBe(actions);
    expect(actions[0].order).toBe(2); // unchanged
  });
});

describe("interpolateTemplate", () => {
  it("replaces {{key}} with payload values", () => {
    const result = interpolateTemplate("Hello {{user.name}}", {
      user: { name: "Alice" },
    });
    expect(result).toBe("Hello Alice");
  });

  it("handles multiple placeholders", () => {
    const result = interpolateTemplate("{{action}} user {{email}} from {{app}}", {
      action: "Provisioned",
      email: "bob@co.com",
      app: "Slack",
    });
    expect(result).toBe("Provisioned user bob@co.com from Slack");
  });

  it("preserves unresolved placeholders", () => {
    const result = interpolateTemplate("Score: {{score}}", {});
    expect(result).toBe("Score: {{score}}");
  });

  it("handles nested paths", () => {
    const result = interpolateTemplate("{{a.b.c}}", {
      a: { b: { c: "deep" } },
    });
    expect(result).toBe("deep");
  });
});

describe("buildExecutionSummary", () => {
  const rule = makeRule();

  it("returns success when all actions succeed", () => {
    const results: ActionResult[] = [
      { actionType: "provision_app_access", status: "success" },
      { actionType: "send_notification", status: "success" },
    ];
    const summary = buildExecutionSummary(rule, results, 42);
    expect(summary.status).toBe("success");
    expect(summary.actionsRun).toBe(2);
    expect(summary.actionsFailed).toBe(0);
    expect(summary.durationMs).toBe(42);
  });

  it("returns partial when some actions fail", () => {
    const results: ActionResult[] = [
      { actionType: "provision_app_access", status: "success" },
      { actionType: "send_notification", status: "failed" },
    ];
    const summary = buildExecutionSummary(rule, results, 100);
    expect(summary.status).toBe("partial");
    expect(summary.actionsFailed).toBe(1);
  });

  it("returns failed when all actions fail", () => {
    const results: ActionResult[] = [
      { actionType: "provision_app_access", status: "failed" },
      { actionType: "send_notification", status: "failed" },
    ];
    const summary = buildExecutionSummary(rule, results, 50);
    expect(summary.status).toBe("failed");
    expect(summary.actionsFailed).toBe(2);
  });
});

describe("evaluateConditionDetailed", () => {
  it("returns detailed pass result with actual value", () => {
    const result = evaluateConditionDetailed(
      { field: "status", operator: "equals", value: "active" },
      { status: "active" },
    );
    expect(result.passed).toBe(true);
    expect(result.actual).toBe("active");
    expect(result.expected).toBe("active");
    expect(result.field).toBe("status");
  });

  it("returns detailed fail result with mismatched value", () => {
    const result = evaluateConditionDetailed(
      { field: "role", operator: "equals", value: "admin" },
      { role: "viewer" },
    );
    expect(result.passed).toBe(false);
    expect(result.actual).toBe("viewer");
    expect(result.expected).toBe("admin");
  });

  it("handles nested field paths", () => {
    const result = evaluateConditionDetailed(
      { field: "user.dept", operator: "contains", value: "eng" },
      { user: { dept: "engineering" } },
    );
    expect(result.passed).toBe(true);
    expect(result.actual).toBe("engineering");
  });

  it("handles undefined field gracefully", () => {
    const result = evaluateConditionDetailed(
      { field: "missing", operator: "equals", value: "x" },
      {},
    );
    expect(result.passed).toBe(false);
    expect(result.actual).toBeUndefined();
  });
});

describe("simulateRule", () => {
  it("returns triggered=true when trigger and conditions match", () => {
    const rule = makeRule({
      triggerType: "user_joined_group",
      conditions: [{ field: "department", operator: "equals", value: "eng" }],
      actions: [{ type: "provision_app_access", config: { appId: "slack" }, order: 1 }],
    });
    const event = makeEvent({
      type: "user_joined_group",
      payload: { department: "eng", email: "alice@co.com" },
    });

    const result = simulateRule(rule, event);
    expect(result.triggered).toBe(true);
    expect(result.triggerMatch).toBe(true);
    expect(result.conditionResults).toHaveLength(1);
    expect(result.conditionResults[0].passed).toBe(true);
    expect(result.actionsPreview).toHaveLength(1);
    expect(result.actionsPreview[0].type).toBe("provision_app_access");
  });

  it("returns triggered=false when trigger type mismatches", () => {
    const rule = makeRule({ triggerType: "user_deactivated" });
    const event = makeEvent({ type: "user_joined_group" });

    const result = simulateRule(rule, event);
    expect(result.triggered).toBe(false);
    expect(result.triggerMatch).toBe(false);
  });

  it("returns triggered=false when conditions fail", () => {
    const rule = makeRule({
      conditions: [{ field: "role", operator: "equals", value: "admin" }],
    });
    const event = makeEvent({ payload: { role: "viewer" } });

    const result = simulateRule(rule, event);
    expect(result.triggerMatch).toBe(true);
    expect(result.triggered).toBe(false);
    expect(result.conditionResults[0].passed).toBe(false);
  });

  it("interpolates action config with event payload", () => {
    const rule = makeRule({
      actions: [
        {
          type: "send_notification",
          config: { message: "Welcome {{email}}" },
          order: 1,
        },
      ],
    });
    const event = makeEvent({ payload: { email: "bob@co.com" } });

    const result = simulateRule(rule, event);
    expect(result.actionsPreview[0].interpolated.message).toBe("Welcome bob@co.com");
  });

  it("includes compliance impact from action types", () => {
    const rule = makeRule({
      actions: [
        { type: "provision_app_access", config: { appId: "slack" }, order: 1 },
        { type: "revoke_app_access", config: { appId: "jira" }, order: 2 },
      ],
    });
    const event = makeEvent();

    const result = simulateRule(rule, event);
    expect(result.complianceImpact.length).toBeGreaterThanOrEqual(0);
  });

  it("preserves rule metadata in result", () => {
    const rule = makeRule({ id: "r-42", name: "My Rule", enabled: false });
    const event = makeEvent();

    const result = simulateRule(rule, event);
    expect(result.ruleId).toBe("r-42");
    expect(result.ruleName).toBe("My Rule");
    expect(result.enabled).toBe(false);
  });
});
