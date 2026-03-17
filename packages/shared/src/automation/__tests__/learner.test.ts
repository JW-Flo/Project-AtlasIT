import { describe, it, expect } from "vitest";
import { generateSuggestions } from "../learner";
import type { AutomationRule } from "../types";

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

describe("generateSuggestions", () => {
  it("returns empty when no connected apps or mappings exist", () => {
    const suggestions = generateSuggestions([], [], []);
    // Should still suggest compliance monitoring even with no apps
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(
      suggestions.some((s) => s.templateId === "compliance-score-drop"),
    ).toBe(true);
  });

  it("suggests provisioning rules for unmapped group↔app pairs", () => {
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

    const provision = suggestions.filter(
      (s) => s.templateId === "auto-provision-on-group-join",
    );
    expect(provision).toHaveLength(1);
    expect(provision[0].ruleInput.triggerConfig.groupId).toBe("eng");
    expect(provision[0].ruleInput.triggerConfig.appId).toBe("slack");
    expect(provision[0].priority).toBe("high");
  });

  it("suggests revoke rules alongside provisioning rules", () => {
    const suggestions = generateSuggestions(
      [],
      [{ appId: "jira", appName: "Jira", healthy: true }],
      [
        {
          groupId: "eng",
          groupName: "Engineering",
          appId: "jira",
          role: "developer",
        },
      ],
    );

    const revoke = suggestions.filter(
      (s) => s.templateId === "auto-revoke-on-group-leave",
    );
    expect(revoke).toHaveLength(1);
    expect(revoke[0].ruleInput.triggerConfig.groupId).toBe("eng");
  });

  it("does not duplicate suggestions for existing rules", () => {
    const existingRules = [
      makeRule({
        triggerType: "user_joined_group",
        triggerConfig: { groupId: "eng", appId: "slack" },
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

    // Should NOT suggest provision for eng→slack since rule already exists
    const provision = suggestions.filter(
      (s) =>
        s.templateId === "auto-provision-on-group-join" &&
        s.ruleInput.triggerConfig.groupId === "eng",
    );
    expect(provision).toHaveLength(0);
  });

  it("suggests health monitoring when apps are connected but no health rule exists", () => {
    const suggestions = generateSuggestions(
      [],
      [{ appId: "okta", appName: "Okta", healthy: true }],
      [],
    );

    const health = suggestions.filter(
      (s) => s.templateId === "health-degradation-alert",
    );
    expect(health).toHaveLength(1);
    expect(health[0].priority).toBe("medium");
  });

  it("does not suggest health monitoring when rule already exists", () => {
    const existingRules = [makeRule({ triggerType: "app_health_changed" })];
    const suggestions = generateSuggestions(
      existingRules,
      [{ appId: "okta", appName: "Okta", healthy: true }],
      [],
    );

    expect(
      suggestions.filter((s) => s.templateId === "health-degradation-alert"),
    ).toHaveLength(0);
  });

  it("suggests offboarding when connected apps exist but no offboard rule", () => {
    const suggestions = generateSuggestions(
      [],
      [{ appId: "slack", appName: "Slack", healthy: true }],
      [],
    );

    const offboard = suggestions.filter(
      (s) => s.templateId === "offboard-user-on-deactivation",
    );
    expect(offboard).toHaveLength(1);
    expect(offboard[0].priority).toBe("high");
  });

  it("suggests onboarding when group mappings exist but no onboard rule", () => {
    const suggestions = generateSuggestions(
      [],
      [],
      [
        {
          groupId: "all",
          groupName: "All Users",
          appId: "google_workspace",
          role: "user",
        },
      ],
    );

    const onboard = suggestions.filter(
      (s) => s.templateId === "onboard-new-user",
    );
    expect(onboard).toHaveLength(1);
  });

  it("returns suggestions sorted by priority (high first)", () => {
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

    const priorities = suggestions.map((s) => s.priority);
    const expected = [...priorities].sort((a, b) => {
      const w: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (w[a] ?? 3) - (w[b] ?? 3);
    });
    expect(priorities).toEqual(expected);
  });

  it("generates multiple suggestions for multiple group mappings", () => {
    const suggestions = generateSuggestions(
      [],
      [
        { appId: "slack", appName: "Slack", healthy: true },
        { appId: "jira", appName: "Jira", healthy: true },
      ],
      [
        {
          groupId: "eng",
          groupName: "Engineering",
          appId: "slack",
          role: "member",
        },
        {
          groupId: "eng",
          groupName: "Engineering",
          appId: "jira",
          role: "developer",
        },
      ],
    );

    const provisions = suggestions.filter(
      (s) => s.templateId === "auto-provision-on-group-join",
    );
    expect(provisions).toHaveLength(2);
  });
});
