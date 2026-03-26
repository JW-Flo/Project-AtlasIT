import { describe, it, expect, vi } from "vitest";
import {
  matchRules,
  sortActions,
  buildExecutionSummary,
  interpolateTemplate,
  evaluateConditions,
} from "@atlasit/shared/automation/engine";
import {
  generateSuggestions,
  generatePatternSuggestions,
} from "@atlasit/shared/automation/learner";
import { ruleTemplates } from "@atlasit/shared/automation/templates";
import type {
  AutomationRule,
  AutomationEvent,
  ActionResult,
  RuleAction,
} from "@atlasit/shared/automation/types";

function makeRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: "rule-1",
    tenantId: "tenant-1",
    name: "Test Rule",
    enabled: true,
    triggerType: "user_joined_group",
    triggerConfig: {},
    conditions: [],
    actions: [
      { type: "send_notification", config: { channel: "general" }, order: 1 },
    ],
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

// ---------------------------------------------------------------------------
// Engine integration-style tests (combining multiple engine functions)
// ---------------------------------------------------------------------------

describe("automation engine integration", () => {
  it("full rule evaluation lifecycle: match → sort → execute → summarize", () => {
    const rules = [
      makeRule({
        id: "r1",
        actions: [
          {
            type: "send_notification",
            config: { msg: "Hello {{user.name}}" },
            order: 2,
          },
          { type: "assign_role", config: { role: "member" }, order: 1 },
        ],
      }),
      makeRule({ id: "r2", enabled: false }),
      makeRule({ id: "r3", triggerType: "user_created" }),
    ];

    const event = makeEvent({
      payload: { user: { name: "Alice" }, groupId: "eng" },
    });

    // Step 1: Match
    const matched = matchRules(rules, event);
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("r1");

    // Step 2: Sort actions
    const sorted = sortActions(matched[0].actions);
    expect(sorted[0].type).toBe("assign_role");
    expect(sorted[1].type).toBe("send_notification");

    // Step 3: Interpolate
    const interpolated = interpolateTemplate(
      sorted[1].config.msg as string,
      event.payload,
    );
    expect(interpolated).toBe("Hello Alice");

    // Step 4: Build summary
    const results: ActionResult[] = [
      { actionType: "assign_role", status: "success" },
      { actionType: "send_notification", status: "success" },
    ];
    const summary = buildExecutionSummary(matched[0], results, 42);
    expect(summary.status).toBe("success");
    expect(summary.actionsRun).toBe(2);
    expect(summary.actionsFailed).toBe(0);
    expect(summary.durationMs).toBe(42);
  });

  it("partial failure summary when some actions fail", () => {
    const results: ActionResult[] = [
      { actionType: "assign_role", status: "success" },
      { actionType: "send_notification", status: "failed", message: "timeout" },
    ];
    const summary = buildExecutionSummary(makeRule(), results, 100);
    expect(summary.status).toBe("partial");
    expect(summary.actionsFailed).toBe(1);
  });

  it("full failure summary when all actions fail", () => {
    const results: ActionResult[] = [
      { actionType: "assign_role", status: "failed" },
      { actionType: "send_notification", status: "failed" },
    ];
    const summary = buildExecutionSummary(makeRule(), results, 50);
    expect(summary.status).toBe("failed");
    expect(summary.actionsFailed).toBe(2);
  });
});

describe("condition evaluation edge cases", () => {
  it("handles deeply nested field access", () => {
    const conditions = [
      {
        field: "user.profile.department",
        operator: "equals" as const,
        value: "Eng",
      },
    ];
    const payload = { user: { profile: { department: "Eng" } } };
    expect(evaluateConditions(conditions, payload)).toBe(true);
  });

  it("returns false for missing nested paths", () => {
    const conditions = [
      { field: "user.missing.field", operator: "equals" as const, value: "x" },
    ];
    expect(evaluateConditions(conditions, {})).toBe(false);
  });

  it("handles numeric comparisons correctly", () => {
    const conditions = [{ field: "score", operator: "gt" as const, value: 80 }];
    expect(evaluateConditions(conditions, { score: 90 })).toBe(true);
    expect(evaluateConditions(conditions, { score: 70 })).toBe(false);
  });

  it("handles in/not_in with arrays", () => {
    const inCondition = [
      {
        field: "status",
        operator: "in" as const,
        value: ["active", "pending"],
      },
    ];
    expect(evaluateConditions(inCondition, { status: "active" })).toBe(true);
    expect(evaluateConditions(inCondition, { status: "disabled" })).toBe(false);

    const notInCondition = [
      {
        field: "status",
        operator: "not_in" as const,
        value: ["banned", "deleted"],
      },
    ];
    expect(evaluateConditions(notInCondition, { status: "active" })).toBe(true);
    expect(evaluateConditions(notInCondition, { status: "banned" })).toBe(
      false,
    );
  });
});

describe("rule matching with trigger config", () => {
  it("matches group-specific rules", () => {
    const rule = makeRule({ triggerConfig: { groupId: "eng-team" } });
    const matchEvent = makeEvent({ payload: { groupId: "eng-team" } });
    const noMatchEvent = makeEvent({ payload: { groupId: "sales-team" } });

    expect(matchRules([rule], matchEvent)).toHaveLength(1);
    expect(matchRules([rule], noMatchEvent)).toHaveLength(0);
  });

  it("matches app-specific rules", () => {
    const rule = makeRule({
      triggerType: "app_connected",
      triggerConfig: { appId: "slack" },
    });

    const matchEvent = makeEvent({
      type: "app_connected",
      payload: { appId: "slack" },
    });
    expect(matchRules([rule], matchEvent)).toHaveLength(1);
  });

  it("matches compliance threshold rules", () => {
    const rule = makeRule({
      triggerType: "compliance_score_changed",
      triggerConfig: { threshold: 70, direction: "below" },
    });

    const belowEvent = makeEvent({
      type: "compliance_score_changed",
      payload: { score: 65 },
    });
    const aboveEvent = makeEvent({
      type: "compliance_score_changed",
      payload: { score: 85 },
    });

    expect(matchRules([rule], belowEvent)).toHaveLength(1);
    expect(matchRules([rule], aboveEvent)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Learner suggestions
// ---------------------------------------------------------------------------

describe("learner suggestions integration", () => {
  it("generates provisioning suggestions for group-app mappings", () => {
    const suggestions = generateSuggestions(
      [],
      [{ appId: "slack", appName: "Slack", healthy: true }],
      [
        {
          groupId: "eng",
          groupName: "Engineering",
          appId: "slack",
          role: "member",
        },
      ],
    );

    const provisionSuggestions = suggestions.filter(
      (s) => s.ruleInput.triggerType === "user_joined_group",
    );
    expect(provisionSuggestions.length).toBeGreaterThan(0);
  });

  it("does not duplicate suggestions when rules already exist", () => {
    const existingRules = [
      makeRule({
        triggerType: "user_joined_group",
        triggerConfig: { groupId: "eng", appId: "slack" },
        actions: [
          {
            type: "provision_app_access",
            config: { appId: "slack" },
            order: 1,
          },
        ],
      }),
    ];

    const suggestions = generateSuggestions(
      existingRules,
      [{ appId: "slack", appName: "Slack", healthy: true }],
      [
        {
          groupId: "eng",
          groupName: "Engineering",
          appId: "slack",
          role: "member",
        },
      ],
    );

    const joinGroupSuggestions = suggestions.filter(
      (s) => s.ruleInput.triggerType === "user_joined_group",
    );
    expect(joinGroupSuggestions).toHaveLength(0);
  });

  it("suggests offboarding when connected apps exist but no deactivation rule", () => {
    const suggestions = generateSuggestions(
      [],
      [{ appId: "slack", appName: "Slack", healthy: true }],
      [],
    );

    const offboard = suggestions.filter(
      (s) => s.ruleInput.triggerType === "user_deactivated",
    );
    expect(offboard.length).toBeGreaterThan(0);
  });

  it("does not suggest offboarding when no connected apps", () => {
    const suggestions = generateSuggestions([], [], []);
    const offboard = suggestions.filter(
      (s) => s.ruleInput.triggerType === "user_deactivated",
    );
    expect(offboard).toHaveLength(0);
  });

  it("suggests compliance monitoring when no compliance rule exists", () => {
    const suggestions = generateSuggestions(
      [],
      [{ appId: "slack", appName: "Slack", healthy: true }],
      [],
    );
    const compliance = suggestions.filter(
      (s) => s.ruleInput.triggerType === "compliance_score_changed",
    );
    expect(compliance.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

describe("rule templates", () => {
  it("exports non-empty templates array", () => {
    expect(ruleTemplates.length).toBeGreaterThan(0);
  });

  it("each template has required fields", () => {
    for (const tmpl of ruleTemplates) {
      expect(tmpl.id).toBeTruthy();
      expect(tmpl.name).toBeTruthy();
      expect(tmpl.triggerType).toBeTruthy();
      expect(tmpl.actions.length).toBeGreaterThan(0);
      expect(tmpl.category).toMatch(
        /^(provisioning|security|compliance|lifecycle)$/,
      );
    }
  });

  it("template actions have valid order fields", () => {
    for (const tmpl of ruleTemplates) {
      const orders = tmpl.actions.map((a) => a.order);
      const sorted = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sorted);
    }
  });
});

// ---------------------------------------------------------------------------
// Pattern-based suggestions (event history learner)
// ---------------------------------------------------------------------------

describe("generatePatternSuggestions", () => {
  it("suggests rules for frequent unmapped events", () => {
    const suggestions = generatePatternSuggestions(
      [],
      [
        {
          type: "user.created",
          source: "directory-sync",
          count: 15,
          latestAt: "2026-03-01",
        },
      ],
    );

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].ruleInput.triggerType).toBe("user_created");
    expect(suggestions[0].priority).toBe("high"); // count >= 10
  });

  it("uses medium priority for events with 3-9 occurrences", () => {
    const suggestions = generatePatternSuggestions(
      [],
      [
        {
          type: "app.health_changed",
          source: "health-monitor",
          count: 5,
          latestAt: "2026-03-01",
        },
      ],
    );

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].priority).toBe("medium");
  });

  it("ignores events with fewer than 3 occurrences", () => {
    const suggestions = generatePatternSuggestions(
      [],
      [
        {
          type: "user.created",
          source: "test",
          count: 2,
          latestAt: "2026-03-01",
        },
      ],
    );

    expect(suggestions).toHaveLength(0);
  });

  it("skips event types that already have matching rules", () => {
    const rules = [makeRule({ triggerType: "user_created" })];
    const suggestions = generatePatternSuggestions(rules, [
      {
        type: "user.created",
        source: "test",
        count: 50,
        latestAt: "2026-03-01",
      },
    ]);

    expect(suggestions).toHaveLength(0);
  });

  it("ignores unknown event types", () => {
    const suggestions = generatePatternSuggestions(
      [],
      [
        {
          type: "custom.unknown.event",
          source: "test",
          count: 100,
          latestAt: "2026-03-01",
        },
      ],
    );

    expect(suggestions).toHaveLength(0);
  });

  it("handles multiple event types", () => {
    const suggestions = generatePatternSuggestions(
      [],
      [
        {
          type: "user.created",
          source: "okta",
          count: 10,
          latestAt: "2026-03-01",
        },
        {
          type: "compliance.score_changed",
          source: "compliance-worker",
          count: 5,
          latestAt: "2026-03-01",
        },
        {
          type: "user.deactivated",
          source: "okta",
          count: 3,
          latestAt: "2026-02-15",
        },
      ],
    );

    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Suggestion dismissal persistence
// ---------------------------------------------------------------------------

describe("suggestion dismissal filtering", () => {
  it("filters dismissed templateIds from merged suggestions", () => {
    const stateSuggestions = [
      {
        templateId: "tmpl-1",
        reason: "r1",
        priority: "high",
        ruleInput: { name: "A", triggerType: "user_created", actions: [] },
      },
      {
        templateId: "tmpl-2",
        reason: "r2",
        priority: "medium",
        ruleInput: { name: "B", triggerType: "user_deactivated", actions: [] },
      },
      {
        templateId: "tmpl-3",
        reason: "r3",
        priority: "low",
        ruleInput: { name: "C", triggerType: "app_connected", actions: [] },
      },
    ];
    const dismissedIds = ["tmpl-1", "tmpl-3"];
    const dismissedSet = new Set(dismissedIds);

    const filtered = stateSuggestions.filter(
      (s) => !dismissedSet.has(s.templateId),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].templateId).toBe("tmpl-2");
  });

  it("returns all suggestions when none are dismissed", () => {
    const suggestions = [
      {
        templateId: "tmpl-1",
        reason: "r1",
        priority: "high",
        ruleInput: { name: "A", triggerType: "user_created", actions: [] },
      },
    ];
    const dismissedSet = new Set<string>();

    const filtered = suggestions.filter((s) => !dismissedSet.has(s.templateId));
    expect(filtered).toHaveLength(1);
  });

  it("returns empty when all are dismissed", () => {
    const suggestions = [
      {
        templateId: "tmpl-1",
        reason: "r1",
        priority: "high",
        ruleInput: { name: "A", triggerType: "user_created", actions: [] },
      },
    ];
    const dismissedSet = new Set(["tmpl-1"]);

    const filtered = suggestions.filter((s) => !dismissedSet.has(s.templateId));
    expect(filtered).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Execution detail view
// ---------------------------------------------------------------------------

describe("execution detail data shape", () => {
  it("parses execution detail with results array", () => {
    const raw = {
      id: "exec-1",
      tenant_id: "t1",
      rule_id: "r1",
      rule_name: "Test Rule",
      trigger_type: "user_joined_group",
      trigger_event: '{"groupId":"eng"}',
      status: "success",
      actions_run: 2,
      actions_failed: 0,
      results: JSON.stringify([
        {
          actionType: "assign_role",
          status: "success",
          message: "Role assigned",
        },
        {
          actionType: "send_notification",
          status: "success",
          message: "Notification sent",
        },
      ]),
      duration_ms: 42,
      started_at: "2026-01-01T00:00:00Z",
      completed_at: "2026-01-01T00:00:01Z",
    };

    const parsed = {
      id: raw.id,
      ruleName: raw.rule_name ?? "Unknown rule",
      triggerEvent: JSON.parse(raw.trigger_event || "{}"),
      status: raw.status,
      actionsRun: raw.actions_run ?? 0,
      actionsFailed: raw.actions_failed ?? 0,
      results: raw.results ? JSON.parse(raw.results) : [],
      durationMs: raw.duration_ms ?? undefined,
    };

    expect(parsed.ruleName).toBe("Test Rule");
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].actionType).toBe("assign_role");
    expect(parsed.triggerEvent.groupId).toBe("eng");
  });

  it("handles execution with null results gracefully", () => {
    const raw = {
      results: null,
      rule_name: null,
    };

    const results = raw.results ? JSON.parse(raw.results) : [];
    const ruleName = raw.rule_name ?? "Unknown rule";

    expect(results).toEqual([]);
    expect(ruleName).toBe("Unknown rule");
  });
});
