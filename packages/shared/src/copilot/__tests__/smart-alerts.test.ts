import { describe, it, expect, vi } from "vitest";
import { detectSmartAlerts } from "../smart-alerts";
import type { CopilotTenantContext } from "../types";

function createMockContext(overrides: Partial<CopilotTenantContext> = {}): CopilotTenantContext {
  return {
    tenantId: "t1",
    tenantName: "Test Corp",
    selectedFrameworks: ["SOC2", "ISO27001"],
    complianceScores: { SOC2: 72, ISO27001: 65 },
    connectedApps: ["okta", "github"],
    adapterHealth: [
      { slug: "okta", lastCollected: new Date().toISOString(), itemCount: 5, error: null },
      { slug: "github", lastCollected: new Date().toISOString(), itemCount: 3, error: null },
    ],
    recentInsights: [],
    remediationStats: { total: 5, open: 2, overdue: 0 },
    evidenceStats: { totalItems: 100, staleCount: 10, recentCount: 20 },
    automationRuleCount: 3,
    policyCount: 8,
    openIncidents: 0,
    ...overrides,
  };
}

function createMockDb(queryResults: Record<string, any> = {}) {
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn(() => ({
        all: vi.fn(async <T>() => {
          // Match query patterns to return appropriate results
          if (sql.includes("compliance_evidence") && sql.includes("adapter")) {
            return { results: queryResults.affectedControls ?? [] };
          }
          if (sql.includes("compliance_history")) {
            return { results: queryResults.history ?? [] };
          }
          if (sql.includes("remediation_plans") && sql.includes("due_date <")) {
            return { results: queryResults.overdueRemediations ?? [] };
          }
          return { results: [] };
        }),
        first: vi.fn(async <T>() => {
          if (sql.includes("compliance_evidence") && sql.includes("COUNT")) {
            return queryResults.evidenceCount ?? { cnt: 10 };
          }
          return null;
        }),
      })),
    })),
  };
}

describe("detectSmartAlerts", () => {
  it("should return empty array when no issues detected", async () => {
    const db = createMockDb({ evidenceCount: { cnt: 10 } });
    const ctx = createMockContext();
    const alerts = await detectSmartAlerts(db as any, "t1", ctx);
    expect(alerts).toEqual([]);
  });

  it("should detect evidence collection stopped", async () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
    const ctx = createMockContext({
      adapterHealth: [{ slug: "okta", lastCollected: twoDaysAgo, itemCount: 5, error: null }],
    });
    const db = createMockDb({
      affectedControls: [{ control_id: "CC6.1" }, { control_id: "CC7.5" }],
    });

    const alerts = await detectSmartAlerts(db as any, "t1", ctx);
    const ecsAlerts = alerts.filter((a) => a.type === "evidence_collection_stopped");
    expect(ecsAlerts.length).toBe(1);
    expect(ecsAlerts[0].title).toContain("okta");
    expect(ecsAlerts[0].title).toContain("2 day(s) ago");
    expect(ecsAlerts[0].affectedControls).toContain("CC6.1");
  });

  it("should set critical severity for 3+ day stoppage", async () => {
    const fourDaysAgo = new Date(Date.now() - 96 * 3600000).toISOString();
    const ctx = createMockContext({
      adapterHealth: [
        { slug: "okta", lastCollected: fourDaysAgo, itemCount: 5, error: "Auth failed" },
      ],
    });
    const db = createMockDb();

    const alerts = await detectSmartAlerts(db as any, "t1", ctx);
    const ecsAlerts = alerts.filter((a) => a.type === "evidence_collection_stopped");
    expect(ecsAlerts[0].severity).toBe("critical");
    expect(ecsAlerts[0].detail).toContain("Auth failed");
  });

  it("should detect score regression trend", async () => {
    const ctx = createMockContext();
    const db = createMockDb({
      history: [
        { framework: "SOC2", score: 80, recorded_at: "2026-03-28T00:00:00Z" },
        { framework: "SOC2", score: 75, recorded_at: "2026-04-01T00:00:00Z" },
        { framework: "SOC2", score: 70, recorded_at: "2026-04-05T00:00:00Z" },
      ],
    });

    const alerts = await detectSmartAlerts(db as any, "t1", ctx);
    const trendAlerts = alerts.filter((a) => a.type === "score_regression_trend");
    expect(trendAlerts.length).toBe(1);
    expect(trendAlerts[0].title).toContain("SOC2");
    expect(trendAlerts[0].title).toContain("declining");
    expect(trendAlerts[0].impact).toContain("could reach");
  });

  it("should detect multiple adapters failing", async () => {
    const ctx = createMockContext({
      adapterHealth: [
        { slug: "okta", lastCollected: new Date().toISOString(), itemCount: 0, error: "Timeout" },
        {
          slug: "github",
          lastCollected: new Date().toISOString(),
          itemCount: 0,
          error: "401 Unauthorized",
        },
      ],
    });
    const db = createMockDb();

    const alerts = await detectSmartAlerts(db as any, "t1", ctx);
    const healthAlerts = alerts.filter((a) => a.type === "adapter_health_degraded");
    expect(healthAlerts.length).toBe(1);
    expect(healthAlerts[0].title).toContain("2 adapters");
  });

  it("should detect overdue remediation escalation", async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 19);
    const ctx = createMockContext({
      remediationStats: { total: 5, open: 3, overdue: 2 },
    });
    const db = createMockDb({
      overdueRemediations: [
        { id: "r1", title: "Fix access controls", due_date: twoWeeksAgo, framework: "SOC2" },
      ],
    });

    const alerts = await detectSmartAlerts(db as any, "t1", ctx);
    const overdueAlerts = alerts.filter((a) => a.type === "remediation_overdue_escalation");
    expect(overdueAlerts.length).toBe(1);
    expect(overdueAlerts[0].severity).toBe("critical");
  });

  it("should detect compliance drift between frameworks", async () => {
    const ctx = createMockContext({
      complianceScores: { SOC2: 85, ISO27001: 50, NIST_CSF: 80 },
    });
    const db = createMockDb({ evidenceCount: { cnt: 10 } });

    const alerts = await detectSmartAlerts(db as any, "t1", ctx);
    const driftAlerts = alerts.filter((a) => a.type === "compliance_drift");
    expect(driftAlerts.length).toBe(1);
    expect(driftAlerts[0].title).toContain("ISO27001");
    expect(driftAlerts[0].title).toContain("below your average");
  });

  it("should sort alerts by severity (critical first)", async () => {
    const fourDaysAgo = new Date(Date.now() - 96 * 3600000).toISOString();
    const ctx = createMockContext({
      adapterHealth: [
        { slug: "okta", lastCollected: fourDaysAgo, itemCount: 0, error: null },
        { slug: "github", lastCollected: new Date().toISOString(), itemCount: 0, error: "Error" },
        { slug: "slack", lastCollected: new Date().toISOString(), itemCount: 0, error: "Error" },
      ],
      complianceScores: { SOC2: 85, ISO27001: 50, NIST_CSF: 80 },
    });
    const db = createMockDb({ evidenceCount: { cnt: 10 } });

    const alerts = await detectSmartAlerts(db as any, "t1", ctx);

    // All critical alerts should come before warning alerts
    let foundWarning = false;
    for (const alert of alerts) {
      if (alert.severity === "warning") foundWarning = true;
      if (alert.severity === "critical" && foundWarning) {
        throw new Error("Critical alert found after a warning alert — sorting is broken");
      }
    }
  });
});
