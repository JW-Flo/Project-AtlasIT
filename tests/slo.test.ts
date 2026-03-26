import { describe, expect, it } from "vitest";
import { ATLASIT_SLOS, errorBudgetRemaining } from "../packages/shared/src/observability/slo";

describe("SLO definitions", () => {
  it("defines 4 SLOs", () => {
    expect(ATLASIT_SLOS).toHaveLength(4);
  });

  it("all SLOs have burn-rate thresholds", () => {
    for (const slo of ATLASIT_SLOS) {
      expect(slo.burnRateThresholds.length).toBeGreaterThanOrEqual(2);
      expect(slo.burnRateThresholds[0].severity).toBe("critical");
    }
  });

  it("all targets are between 0 and 1", () => {
    for (const slo of ATLASIT_SLOS) {
      expect(slo.target).toBeGreaterThan(0);
      expect(slo.target).toBeLessThanOrEqual(1);
    }
  });
});

describe("errorBudgetRemaining", () => {
  it("returns 1.0 when no errors", () => {
    expect(errorBudgetRemaining(0.99, 100, 100)).toBe(1.0);
  });

  it("returns 0.0 when budget exhausted", () => {
    expect(errorBudgetRemaining(0.99, 98, 100)).toBe(0.0);
  });

  it("returns ~0.5 when half budget consumed", () => {
    // 99% target, 1% budget. 0.5% errors = 50% budget consumed.
    const result = errorBudgetRemaining(0.99, 995, 1000);
    expect(result).toBeCloseTo(0.5, 1);
  });

  it("returns 1.0 for zero total", () => {
    expect(errorBudgetRemaining(0.99, 0, 0)).toBe(1.0);
  });
});
