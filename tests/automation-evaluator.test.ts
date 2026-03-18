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
