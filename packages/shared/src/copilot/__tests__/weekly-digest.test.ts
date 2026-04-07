import { describe, it, expect, vi } from "vitest";
import {
  buildWeeklyDigestContext,
  formatWeeklyDigestPrompt,
  assembleWeeklyDigest,
} from "../weekly-digest";
import type { CopilotTenantContext } from "../types";

function createMockDb(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    scoreHistory: [],
    currentScores: [],
    evidenceNew: { cnt: 0 },
    evidenceExpired: { cnt: 0 },
    evidenceSources: [],
    upcomingRemediations: [],
    upcomingPolicies: [],
  };
  const data = { ...defaults, ...overrides };

  let callIndex = 0;
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        all: vi.fn(async () => {
          const keys = [
            "scoreHistory",
            "currentScores",
            "evidenceNew",
            "evidenceExpired",
            "evidenceSources",
            "upcomingRemediations",
            "upcomingPolicies",
          ];
          const key = keys[callIndex++];
          if (key === "evidenceNew" || key === "evidenceExpired") {
            return { results: [] }; // first is handled, but we use first() not all()
          }
          return { results: data[key] ?? [] };
        }),
        first: vi.fn(async () => {
          const keys = [
            "scoreHistory",
            "currentScores",
            "evidenceNew",
            "evidenceExpired",
            "evidenceSources",
            "upcomingRemediations",
            "upcomingPolicies",
          ];
          const key = keys[callIndex++];
          return data[key] ?? null;
        }),
      })),
    })),
  };
}

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
    remediationStats: { total: 5, open: 2, overdue: 1 },
    evidenceStats: { totalItems: 100, staleCount: 10, recentCount: 20 },
    automationRuleCount: 3,
    policyCount: 8,
    openIncidents: 0,
    ...overrides,
  };
}

describe("buildWeeklyDigestContext", () => {
  it("should build context with score changes from history", async () => {
    const db = createMockDb({
      scoreHistory: [
        { framework: "SOC2", score: 68, grade: "C", recorded_at: "2026-04-01T00:00:00Z" },
        { framework: "SOC2", score: 72, grade: "B", recorded_at: "2026-04-07T00:00:00Z" },
      ],
      currentScores: [{ framework: "SOC2", score: 72, grade: "B" }],
    });
    const ctx = createMockContext();
    const result = await buildWeeklyDigestContext(db as any, "t1", ctx);

    expect(result.tenantId).toBe("t1");
    expect(result.tenantName).toBe("Test Corp");
    expect(result.scoreChanges).toBeDefined();
    expect(result.evidenceSummary).toBeDefined();
    expect(result.copilotContext).toBe(ctx);
  });

  it("should detect drift alerts from unhealthy adapters", async () => {
    const ctx = createMockContext({
      adapterHealth: [
        {
          slug: "okta",
          lastCollected: "2026-04-01T00:00:00Z",
          itemCount: 0,
          error: "Token expired",
        },
      ],
    });
    const db = createMockDb({
      currentScores: [{ framework: "SOC2", score: 72, grade: "B" }],
    });

    const result = await buildWeeklyDigestContext(db as any, "t1", ctx);
    expect(result.driftAlerts.length).toBeGreaterThanOrEqual(1);
    expect(result.driftAlerts[0].title).toContain("okta");
  });

  it("should detect score regression drift alerts", async () => {
    const db = createMockDb({
      scoreHistory: [
        { framework: "SOC2", score: 80, grade: "A", recorded_at: "2026-04-01T00:00:00Z" },
      ],
      currentScores: [{ framework: "SOC2", score: 70, grade: "B" }],
    });
    const ctx = createMockContext({ complianceScores: { SOC2: 70 } });

    const result = await buildWeeklyDigestContext(db as any, "t1", ctx);
    const regressionAlerts = result.driftAlerts.filter((d) => d.title.includes("dropped"));
    expect(regressionAlerts.length).toBe(1);
    expect(regressionAlerts[0].severity).toBe("critical");
  });
});

describe("formatWeeklyDigestPrompt", () => {
  it("should generate valid AI messages", () => {
    const ctx = {
      tenantId: "t1",
      tenantName: "Test Corp",
      scoreChanges: [
        { framework: "SOC2", previousScore: 68, currentScore: 72, delta: 4, grade: "B" },
      ],
      evidenceSummary: { newItems: 15, expiredItems: 3, totalItems: 100, topSources: [] },
      driftAlerts: [],
      upcomingDeadlines: [],
      copilotContext: createMockContext(),
    };

    const messages = formatWeeklyDigestPrompt(ctx);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[0].content).toContain("Test Corp");
    expect(messages[0].content).toContain("SOC2");
  });
});

describe("assembleWeeklyDigest", () => {
  it("should assemble a complete weekly digest", () => {
    const ctx = {
      tenantId: "t1",
      tenantName: "Test Corp",
      scoreChanges: [
        { framework: "SOC2", previousScore: 68, currentScore: 72, delta: 4, grade: "B" },
      ],
      evidenceSummary: { newItems: 15, expiredItems: 3, totalItems: 100, topSources: [] },
      driftAlerts: [],
      upcomingDeadlines: [],
      copilotContext: createMockContext(),
    };

    const aiResponse = {
      executiveSummary: "Good week for compliance.",
      recommendations: ["Keep collecting evidence", "Review SOC2 controls"],
    };

    const digest = assembleWeeklyDigest(ctx, aiResponse);
    expect(digest.tenantId).toBe("t1");
    expect(digest.executiveSummary).toBe("Good week for compliance.");
    expect(digest.recommendations).toHaveLength(2);
    expect(digest.scoreChanges).toHaveLength(1);
    expect(digest.weekStart).toBeDefined();
    expect(digest.weekEnd).toBeDefined();
    expect(new Date(digest.weekEnd).getTime() - new Date(digest.weekStart).getTime()).toBeCloseTo(
      7 * 86400000,
      -3,
    );
  });
});
