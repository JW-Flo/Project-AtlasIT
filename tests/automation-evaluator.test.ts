import { describe, it, expect, vi, beforeEach } from "vitest";
import { evaluateAutomationRules } from "../ai-orchestrator/src/lib/automation-evaluator";

// Mock D1Database
function createMockDb(rules: Record<string, unknown>[] = []) {
  const insertedExecutions: Record<string, unknown>[] = [];
  const updatedRules: Array<{ args: unknown[] }> = [];

  const mockDb = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async all() {
              if (sql.includes("SELECT * FROM automation_rules")) {
                return { results: rules };
              }
              return { results: [] };
            },
            async run() {
              if (sql.includes("INSERT INTO automation_executions")) {
                insertedExecutions.push({ sql, args });
              }
              if (sql.includes("UPDATE automation_rules")) {
                updatedRules.push({ args });
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
    _insertedExecutions: insertedExecutions,
    _updatedRules: updatedRules,
  };

  return mockDb as unknown as D1Database & {
    _insertedExecutions: typeof insertedExecutions;
    _updatedRules: typeof updatedRules;
  };
}

function makeDbRule(overrides: Record<string, unknown> = {}) {
  return {
    id: "rule-1",
    tenant_id: "tenant-1",
    name: "Test Rule",
    enabled: 1,
    trigger_type: "user_created",
    trigger_config: "{}",
    conditions: "[]",
    actions: JSON.stringify([
      { type: "send_notification", config: { channel: "general" }, order: 1 },
    ]),
    last_run_at: null,
    last_status: null,
    run_count: 0,
    error_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: null,
    ...overrides,
  };
}

describe("evaluateAutomationRules", () => {
  it("returns empty when event type has no mapping", async () => {
    const db = createMockDb([makeDbRule()]);
    const result = await evaluateAutomationRules(
      db,
      "tenant-1",
      "unknown.event",
      "test",
      {},
    );
    expect(result.matched).toBe(0);
    expect(result.executions).toEqual([]);
  });

  it("returns empty when tenant has no rules", async () => {
    const db = createMockDb([]);
    const result = await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      {},
    );
    expect(result.matched).toBe(0);
    expect(result.executions).toEqual([]);
  });

  it("matches and executes a user_created rule", async () => {
    const db = createMockDb([makeDbRule()]);
    const result = await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "directory-sync",
      { userId: "u1", email: "test@example.com" },
    );

    expect(result.matched).toBe(1);
    expect(result.executions).toHaveLength(1);
    expect(result.executions[0].ruleId).toBe("rule-1");
    expect(result.executions[0].status).toBe("success");
    expect(result.executions[0].actionsRun).toBe(1);
  });

  it("records execution in D1", async () => {
    const db = createMockDb([makeDbRule()]);
    await evaluateAutomationRules(db, "tenant-1", "user.created", "test", {});

    expect(db._insertedExecutions).toHaveLength(1);
    expect(db._updatedRules).toHaveLength(1);
  });

  it("skips disabled rules", async () => {
    const db = createMockDb([makeDbRule({ enabled: 0 })]);
    const result = await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      {},
    );

    expect(result.matched).toBe(0);
  });

  it("matches rules with conditions", async () => {
    const rule = makeDbRule({
      conditions: JSON.stringify([
        { field: "department", operator: "equals", value: "Engineering" },
      ]),
    });
    const db = createMockDb([rule]);

    const matched = await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      { department: "Engineering" },
    );
    expect(matched.matched).toBe(1);

    const db2 = createMockDb([rule]);
    const notMatched = await evaluateAutomationRules(
      db2,
      "tenant-1",
      "user.created",
      "test",
      { department: "Sales" },
    );
    expect(notMatched.matched).toBe(0);
  });

  it("maps all supported event types", async () => {
    const mappings: Array<[string, string]> = [
      ["user.created", "user_created"],
      ["user.deactivated", "user_deactivated"],
      ["user.joined_group", "user_joined_group"],
      ["user.left_group", "user_left_group"],
      ["app.connected", "app_connected"],
      ["app.disconnected", "app_disconnected"],
      ["app.health_changed", "app_health_changed"],
      ["compliance.score_changed", "compliance_score_changed"],
    ];

    for (const [eventType, triggerType] of mappings) {
      const db = createMockDb([makeDbRule({ trigger_type: triggerType })]);
      const result = await evaluateAutomationRules(
        db,
        "tenant-1",
        eventType,
        "test",
        {},
      );
      expect(result.matched).toBe(1);
    }
  });

  it("handles multiple matching rules", async () => {
    const rules = [
      makeDbRule({ id: "rule-1", name: "Rule A" }),
      makeDbRule({ id: "rule-2", name: "Rule B" }),
    ];
    const db = createMockDb(rules);

    const result = await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      {},
    );

    expect(result.matched).toBe(2);
    expect(result.executions).toHaveLength(2);
    expect(db._insertedExecutions).toHaveLength(2);
    expect(db._updatedRules).toHaveLength(2);
  });

  it("interpolates template strings in action config", async () => {
    const rule = makeDbRule({
      actions: JSON.stringify([
        {
          type: "send_notification",
          config: { message: "Welcome {{email}}!" },
          order: 1,
        },
      ]),
    });
    const db = createMockDb([rule]);

    const result = await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      { email: "alice@example.com" },
    );

    expect(result.matched).toBe(1);
    expect(result.executions[0].status).toBe("success");
  });
});
