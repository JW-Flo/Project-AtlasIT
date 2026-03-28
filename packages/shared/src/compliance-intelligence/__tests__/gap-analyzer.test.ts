import { describe, it, expect } from "vitest";
import { analyzeComplianceGaps } from "../gap-analyzer";
import type { ComplianceGap, GapAnalysisResult } from "../types";

/** Minimal D1-like mock: prepare().bind().all() chain */
function mockDb(rows: Record<string, unknown>[] = []) {
  return {
    prepare: () => ({
      bind: (..._args: unknown[]) => ({
        all: async () => ({ results: rows }),
      }),
    }),
  };
}

describe("analyzeComplianceGaps", () => {
  it("returns gaps for all controls when no evidence exists", async () => {
    const db = mockDb([]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2"]);

    expect(result.tenantId).toBe("tenant-1");
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.gaps.every((g) => g.gapType === "missing")).toBe(true);
    expect(result.gaps.every((g) => g.framework === "SOC2")).toBe(true);
    expect(result.summary.missingCount).toBe(result.summary.totalControls);
    expect(result.summary.coveragePercent).toBe(0);
  });

  it("marks controls with recent evidence as covered (no gap)", async () => {
    const now = new Date().toISOString();
    const db = mockDb([
      {
        framework: "SOC2",
        control_id: "CC6.1",
        latest_at: now,
        evidence_count: 3,
        latest_status: "pass",
      },
    ]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2"]);

    // CC6.1 should NOT appear in gaps (it has recent evidence)
    const cc61Gap = result.gaps.find((g) => g.controlId === "CC6.1");
    expect(cc61Gap).toBeUndefined();
    expect(result.summary.coveredControls).toBeGreaterThanOrEqual(1);
  });

  it("detects stale evidence (>30 days old)", async () => {
    const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const db = mockDb([
      {
        framework: "SOC2",
        control_id: "CC6.1",
        latest_at: staleDate,
        evidence_count: 1,
        latest_status: "pass",
      },
    ]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2"]);

    const cc61Gap = result.gaps.find((g) => g.controlId === "CC6.1");
    expect(cc61Gap).toBeDefined();
    expect(cc61Gap!.gapType).toBe("stale");
    expect(cc61Gap!.staleDays).toBeGreaterThanOrEqual(44);
    expect(result.summary.staleCount).toBeGreaterThanOrEqual(1);
  });

  it("detects failing adapter evidence", async () => {
    const now = new Date().toISOString();
    const db = mockDb([
      {
        framework: "SOC2",
        control_id: "CC6.1",
        latest_at: now,
        evidence_count: 2,
        latest_status: "fail",
      },
    ]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2"]);

    const cc61Gap = result.gaps.find((g) => g.controlId === "CC6.1");
    expect(cc61Gap).toBeDefined();
    expect(cc61Gap!.gapType).toBe("failing");
    expect(result.summary.failingCount).toBeGreaterThanOrEqual(1);
  });

  it("analyzes multiple frameworks", async () => {
    const db = mockDb([]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2", "HIPAA"]);

    const frameworks = new Set(result.gaps.map((g) => g.framework));
    expect(frameworks.has("SOC2")).toBe(true);
    expect(frameworks.has("HIPAA")).toBe(true);
    expect(result.frameworks).toEqual(["SOC2", "HIPAA"]);
  });

  it("generates actionable recommendations for missing evidence", async () => {
    const db = mockDb([]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2"]);

    // Every gap should have a non-empty recommendation
    for (const gap of result.gaps) {
      expect(gap.recommendation).toBeTruthy();
      expect(gap.recommendation.length).toBeGreaterThan(10);
    }
  });

  it("assigns priority based on gap type and control importance", async () => {
    const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const db = mockDb([
      {
        framework: "SOC2",
        control_id: "CC6.1",
        latest_at: now,
        evidence_count: 1,
        latest_status: "fail",
      },
      {
        framework: "SOC2",
        control_id: "CC6.3",
        latest_at: staleDate,
        evidence_count: 1,
        latest_status: "pass",
      },
    ]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2"]);

    const failingGap = result.gaps.find((g) => g.controlId === "CC6.1");
    const staleGap = result.gaps.find((g) => g.controlId === "CC6.3");

    // Failing controls should be higher priority than stale
    expect(failingGap).toBeDefined();
    expect(staleGap).toBeDefined();
    expect(["critical", "high"]).toContain(failingGap!.priority);
  });

  it("returns correct summary statistics", async () => {
    const now = new Date().toISOString();
    const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const db = mockDb([
      {
        framework: "SOC2",
        control_id: "CC6.1",
        latest_at: now,
        evidence_count: 3,
        latest_status: "pass",
      },
      {
        framework: "SOC2",
        control_id: "CC6.3",
        latest_at: staleDate,
        evidence_count: 1,
        latest_status: "pass",
      },
      {
        framework: "SOC2",
        control_id: "CC7.1",
        latest_at: now,
        evidence_count: 1,
        latest_status: "fail",
      },
    ]);
    const result = await analyzeComplianceGaps(db, "tenant-1", ["SOC2"]);

    expect(result.summary.totalControls).toBeGreaterThan(0);
    expect(result.summary.coveredControls).toBe(1); // only CC6.1 is recent + pass
    expect(result.summary.staleCount).toBe(1);
    expect(result.summary.failingCount).toBe(1);
    expect(result.summary.missingCount).toBe(
      result.summary.totalControls - 3, // 3 have some evidence, rest missing
    );
  });

  it("returns empty gaps array for empty framework list", async () => {
    const db = mockDb([]);
    const result = await analyzeComplianceGaps(db, "tenant-1", []);

    expect(result.gaps).toEqual([]);
    expect(result.summary.totalControls).toBe(0);
  });
});
