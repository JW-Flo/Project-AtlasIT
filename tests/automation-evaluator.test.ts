/**
 * Tests for compliance evidence emission in automation-evaluator.
 *
 * Uses create_incident (D1-only, no fetch) for evidence emission tests to avoid
 * network dependency. Tests verify emitComplianceEvidence inserts one row per
 * mapped control on action success, and zero rows on skip/fail.
 */
import { describe, it, expect, vi } from "vitest";
import { ACTION_COMPLIANCE_MAP } from "@atlasit/shared/automation/compliance-mapping";

// ---------------------------------------------------------------------------
// D1 mock — records all prepare() SQL calls
// ---------------------------------------------------------------------------

function makeD1(rulesRows: Record<string, unknown>[] = []) {
  const preparedSqls: string[] = [];

  function makeStmt(sql: string) {
    return {
      bind: (..._args: unknown[]) => makeStmt(sql),
      run: vi.fn(async () => {
        preparedSqls.push(sql);
        return { meta: { changes: 1 }, success: true };
      }),
      all: vi.fn(async () => {
        preparedSqls.push(sql);
        return { results: rulesRows };
      }),
      first: vi.fn(async () => {
        preparedSqls.push(sql);
        return rulesRows[0] ?? null;
      }),
    };
  }

  const prepare = vi.fn((sql: string) => makeStmt(sql));

  const db = {
    prepare,
    get _preparedSqls() {
      return preparedSqls;
    },
  } as unknown as D1Database & { _preparedSqls: string[] };

  return db;
}

// Mock D1Database — tracks evidence inserts separately
function createMockDb(rules: Record<string, unknown>[] = []) {
  const insertedExecutions: Record<string, unknown>[] = [];
  const updatedRules: Array<{ args: unknown[] }> = [];
  const insertedEvidence: Array<{ sql: string; args: unknown[] }> = [];

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
              if (sql.includes("INSERT OR IGNORE INTO compliance_evidence")) {
                insertedEvidence.push({ sql, args });
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
    _insertedExecutions: insertedExecutions,
    _updatedRules: updatedRules,
    _insertedEvidence: insertedEvidence,
  };

  return mockDb as unknown as D1Database & {
    _insertedExecutions: typeof insertedExecutions;
    _updatedRules: typeof updatedRules;
    _insertedEvidence: typeof insertedEvidence;
  };
}

// ---------------------------------------------------------------------------
// Rule fixture — uses create_incident (D1-only action, no fetch required)
// ---------------------------------------------------------------------------

function makeRuleRow(actionType: string, config: Record<string, unknown> = {}): Record<string, unknown> {
  const defaultConfig: Record<string, Record<string, unknown>> = {
    create_incident: { severity: "medium", title: "Test incident" },
    update_compliance_status: { controlId: "SOC2_CC6.1", status: "implemented" },
    provision_app_access: { appId: "slack" },
    revoke_app_access: { appId: "slack" },
    send_notification: {},
  };

  return {
    id: `rule-${actionType}`,
    tenant_id: "tenant-test",
    name: `Test ${actionType}`,
    description: null,
    enabled: 1,
    trigger_type: "user_created",
    trigger_config: "{}",
    conditions: "[]",
    actions: JSON.stringify([
      { type: actionType, order: 1, config: { ...(defaultConfig[actionType] ?? {}), ...config } },
    ]),
    last_run_at: null,
    last_status: null,
    run_count: 0,
    error_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: null,
  };
}

/** Minimal rule row with partial overrides — used by the createMockDb test group */
function makeDbRule(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "rule-test",
    tenant_id: "tenant-1",
    name: "Test rule",
    description: null,
    enabled: 1,
    trigger_type: "user_created",
    trigger_config: "{}",
    conditions: "[]",
    actions: "[]",
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

// ---------------------------------------------------------------------------
// Mock profile-enricher
// ---------------------------------------------------------------------------

vi.mock("../ai-orchestrator/src/lib/profile-enricher.js", () => ({
  enrichUserProfile: vi.fn(async () => null),
}));

const { evaluateAutomationRules } = await import(
  "../ai-orchestrator/src/lib/automation-evaluator.js"
);

// ---------------------------------------------------------------------------
// Evidence emission tests
// ---------------------------------------------------------------------------

describe("automation-evaluator — compliance evidence emission", () => {
  it("emits compliance_evidence rows on create_incident success", async () => {
    const db = makeD1([makeRuleRow("create_incident")]);

    await evaluateAutomationRules(
      db,
      "tenant-test",
      "user.created",
      "test",
      { email: "alice@example.com" },
      undefined,
      { sharedDb: db }, // required for create_incident
    );

    const controls = ACTION_COMPLIANCE_MAP["create_incident"] ?? [];
    expect(controls.length).toBeGreaterThan(0);

    const evidenceInserts = (db as ReturnType<typeof makeD1>)._preparedSqls.filter((sql) =>
      sql.includes("INSERT OR IGNORE INTO compliance_evidence"),
    );
    expect(evidenceInserts.length).toBe(controls.length);
  });

  it("emits compliance_evidence rows on update_compliance_status success", async () => {
    const db = makeD1([makeRuleRow("update_compliance_status")]);

    await evaluateAutomationRules(
      db,
      "tenant-test",
      "user.created",
      "test",
      { email: "bob@example.com" },
      undefined,
      { sharedDb: db },
    );

    const controls = ACTION_COMPLIANCE_MAP["update_compliance_status"] ?? [];
    expect(controls.length).toBeGreaterThan(0);

    const evidenceInserts = (db as ReturnType<typeof makeD1>)._preparedSqls.filter((sql) =>
      sql.includes("INSERT OR IGNORE INTO compliance_evidence"),
    );
    expect(evidenceInserts.length).toBe(controls.length);
  });

  it("does NOT emit evidence when action is skipped (send_notification, no selfUrl)", async () => {
    const db = makeD1([makeRuleRow("send_notification")]);

    await evaluateAutomationRules(
      db,
      "tenant-test",
      "user.created",
      "test",
      { email: "charlie@example.com" },
      undefined,
      { selfUrl: undefined },
    );

    const evidenceInserts = (db as ReturnType<typeof makeD1>)._preparedSqls.filter((sql) =>
      sql.includes("INSERT OR IGNORE INTO compliance_evidence"),
    );
    expect(evidenceInserts.length).toBe(0);
  });

  it("does NOT emit evidence when action is skipped (create_incident, no sharedDb)", async () => {
    const db = makeD1([makeRuleRow("create_incident")]);

    await evaluateAutomationRules(
      db,
      "tenant-test",
      "user.created",
      "test",
      { email: "dave@example.com" },
      // no actionContext → sharedDb is undefined → create_incident skipped
    );

    const evidenceInserts = (db as ReturnType<typeof makeD1>)._preparedSqls.filter((sql) =>
      sql.includes("INSERT OR IGNORE INTO compliance_evidence"),
    );
    expect(evidenceInserts.length).toBe(0);
  });

  it("evidence emission error is swallowed (does not reject the evaluation)", async () => {
    const db = makeD1([makeRuleRow("create_incident")]);

    // Make compliance_evidence INSERT throw
    const originalPrepare = db.prepare;
    vi.spyOn(db as ReturnType<typeof makeD1>, "prepare").mockImplementation((sql: string) => {
      if (sql.includes("compliance_evidence")) {
        return {
          bind: () => ({
            run: vi.fn(async () => {
              throw new Error("D1 write failed");
            }),
          }),
        } as unknown as ReturnType<typeof originalPrepare>;
      }
      return originalPrepare(sql);
    });

    await expect(
      evaluateAutomationRules(
        db,
        "tenant-test",
        "user.created",
        "test",
        { email: "eve@example.com" },
        undefined,
        { sharedDb: db },
      ),
    ).resolves.toBeDefined();
  });

  it("returns matched:0 and no evidence when no rules in DB", async () => {
    const db = makeD1([]); // empty DB

    const result = await evaluateAutomationRules(
      db,
      "tenant-test",
      "user.created",
      "test",
      {},
    );

    expect(result.matched).toBe(0);
    const evidenceInserts = (db as ReturnType<typeof makeD1>)._preparedSqls.filter((sql) =>
      sql.includes("INSERT OR IGNORE INTO compliance_evidence"),
    );
    expect(evidenceInserts.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ACTION_COMPLIANCE_MAP completeness
// ---------------------------------------------------------------------------

describe("ACTION_COMPLIANCE_MAP — mapping completeness", () => {
  const requiredActionTypes = [
    "provision_app_access",
    "revoke_app_access",
    "run_workflow",
    "create_incident",
    "assign_role",
    "remove_role",
    "sync_directory",
    "update_compliance_status",
    "send_notification",
  ];

  for (const actionType of requiredActionTypes) {
    it(`${actionType} maps to at least one compliance control`, () => {
      const controls = ACTION_COMPLIANCE_MAP[actionType];
      expect(controls, `${actionType} should be in ACTION_COMPLIANCE_MAP`).toBeDefined();
      expect(controls!.length).toBeGreaterThan(0);
    });
  }

  it("every control ref has required fields (framework, controlId, controlName, evidenceType)", () => {
    for (const [actionType, controls] of Object.entries(ACTION_COMPLIANCE_MAP)) {
      for (const ctrl of controls) {
        expect(ctrl.framework, `${actionType}.framework`).toBeDefined();
        expect(ctrl.controlId, `${actionType}.controlId`).toBeTruthy();
        expect(ctrl.controlName, `${actionType}.controlName`).toBeTruthy();
        expect(ctrl.evidenceType, `${actionType}.evidenceType`).toBeTruthy();
      }
    }
  });
});

describe("compliance evidence emission", () => {
  it("emits evidence rows when provision_app_access succeeds", async () => {
    const rule = makeDbRule({
      trigger_type: "user_created",
      actions: JSON.stringify([
        {
          type: "provision_app_access",
          config: { appId: "slack", role: "member" },
          order: 1,
        },
      ]),
    });

    // Mock adapter fetch to succeed
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const db = createMockDb([rule]);
    await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      { email: "alice@example.com" },
      undefined,
      { sharedDb: db },
    );

    const expectedControls =
      ACTION_COMPLIANCE_MAP["provision_app_access"] ?? [];
    expect(db._insertedEvidence).toHaveLength(expectedControls.length);

    // Verify tenant isolation on each row
    for (const row of db._insertedEvidence) {
      expect(row.args).toContain("tenant-1");
      expect(row.args).toContain("automation");
    }

    global.fetch = originalFetch;
  });

  it("emits evidence rows when revoke_app_access succeeds", async () => {
    const rule = makeDbRule({
      trigger_type: "user_deactivated",
      actions: JSON.stringify([
        {
          type: "revoke_app_access",
          config: { appId: "github" },
          order: 1,
        },
      ]),
    });

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const db = createMockDb([rule]);
    await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.deactivated",
      "test",
      { email: "bob@example.com" },
      undefined,
      { sharedDb: db },
    );

    const expectedControls = ACTION_COMPLIANCE_MAP["revoke_app_access"] ?? [];
    expect(db._insertedEvidence).toHaveLength(expectedControls.length);

    global.fetch = originalFetch;
  });

  it("does not emit evidence when action is skipped (no adapter URL)", async () => {
    // provision_app_access with an unknown appId and no adapterUrls → skipped
    const rule = makeDbRule({
      trigger_type: "user_created",
      actions: JSON.stringify([
        {
          type: "provision_app_access",
          config: { appId: "nonexistent-app-xyz" },
          order: 1,
        },
      ]),
    });

    // Make fetch fail so we exercise the skip path
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("connect refused"));

    const db = createMockDb([rule]);
    await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      { email: "carol@example.com" },
      undefined,
      { sharedDb: db },
    );

    // Evidence should be 0 — action resolved as failed/skipped not success
    // (fetch throws → action fails → no evidence)
    expect(db._insertedEvidence).toHaveLength(0);

    global.fetch = originalFetch;
  });

  it("does not emit evidence when sharedDb is absent", async () => {
    const rule = makeDbRule({
      trigger_type: "user_created",
      actions: JSON.stringify([
        {
          type: "provision_app_access",
          config: { appId: "slack" },
          order: 1,
        },
      ]),
    });

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const db = createMockDb([rule]);
    // Intentionally pass no actionContext (no sharedDb)
    await evaluateAutomationRules(
      db,
      "tenant-1",
      "user.created",
      "test",
      { email: "dave@example.com" },
    );

    expect(db._insertedEvidence).toHaveLength(0);

    global.fetch = originalFetch;
  });

  it("ACTION_COMPLIANCE_MAP covers the 3 core action types", () => {
    expect(ACTION_COMPLIANCE_MAP["provision_app_access"]).toBeDefined();
    expect(ACTION_COMPLIANCE_MAP["provision_app_access"]!.length).toBeGreaterThan(0);

    expect(ACTION_COMPLIANCE_MAP["revoke_app_access"]).toBeDefined();
    expect(ACTION_COMPLIANCE_MAP["revoke_app_access"]!.length).toBeGreaterThan(0);

    expect(ACTION_COMPLIANCE_MAP["run_workflow"]).toBeDefined();
    expect(ACTION_COMPLIANCE_MAP["run_workflow"]!.length).toBeGreaterThan(0);
  });

  it("each mapping entry has required fields", () => {
    for (const [actionType, controls] of Object.entries(ACTION_COMPLIANCE_MAP)) {
      for (const control of controls) {
        expect(control.framework, `${actionType} missing framework`).toBeTruthy();
        expect(control.controlId, `${actionType} missing controlId`).toBeTruthy();
        expect(control.controlName, `${actionType} missing controlName`).toBeTruthy();
        expect(control.evidenceType, `${actionType} missing evidenceType`).toBeTruthy();
      }
    }
  });
});
