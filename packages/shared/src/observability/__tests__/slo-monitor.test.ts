import { describe, expect, it } from "vitest";
import { SLOMonitor } from "../slo-monitor.js";
import { ATLASIT_SLOS } from "../slo.js";
import type { SLOMetricCounts } from "../slo-monitor.js";

const NOW = "2026-03-20T12:00:00.000Z";

describe("SLOMonitor", () => {
  describe("constructor", () => {
    it("defaults to ATLASIT_SLOS when no definitions supplied", () => {
      const monitor = new SLOMonitor();
      expect(monitor.sloNames()).toEqual(ATLASIT_SLOS.map((s) => s.name));
    });

    it("accepts custom SLO definitions", () => {
      const custom = [ATLASIT_SLOS[0]];
      const monitor = new SLOMonitor(custom);
      expect(monitor.sloNames()).toEqual([ATLASIT_SLOS[0].name]);
    });
  });

  describe("checkSLO", () => {
    it("returns full budget and no alerts when all requests succeed", () => {
      const monitor = new SLOMonitor();
      const perfect: SLOMetricCounts = {
        goodCount: 1000,
        totalCount: 1000,
        windowStart: NOW,
      };
      const result = monitor.checkSLO("api_availability", perfect, perfect);

      expect(result.sloName).toBe("api_availability");
      expect(result.currentRate).toBe(1);
      expect(result.budgetRemaining).toBe(1);
      expect(result.alerts).toHaveLength(0);
    });

    it("returns budgetRemaining=1 when total is zero", () => {
      const monitor = new SLOMonitor();
      const empty: SLOMetricCounts = {
        goodCount: 0,
        totalCount: 0,
        windowStart: NOW,
      };
      const result = monitor.checkSLO("api_availability", empty, empty);
      expect(result.budgetRemaining).toBe(1);
      expect(result.alerts).toHaveLength(0);
    });

    it("fires critical alert when both windows exceed critical burn-rate threshold", () => {
      const monitor = new SLOMonitor();
      // api_availability target=0.999, critical burnRate=14.4
      // errorBudget = 1 - 0.999 = 0.001
      // actualBurnRate = (1 - goodRate) / (1 - target)
      // We need actualBurnRate > 14.4 => errorRate > 14.4 * 0.001 = 0.0144
      // => goodRate < 1 - 0.0144 = 0.9856
      // Use goodRate = 0.97 => errorRate=0.03 => burnRate = 0.03/0.001 = 30
      const hotWindow: SLOMetricCounts = {
        goodCount: 970,
        totalCount: 1000,
        windowStart: NOW,
      };
      const result = monitor.checkSLO("api_availability", hotWindow, hotWindow);

      const criticalAlerts = result.alerts.filter(
        (a) => a.severity === "critical",
      );
      expect(criticalAlerts).toHaveLength(1);
      expect(criticalAlerts[0].actualBurnRate).toBeCloseTo(30, 1);
    });

    it("fires warning alert when both windows exceed warning threshold but not critical", () => {
      const monitor = new SLOMonitor();
      // api_availability warning burnRate=6
      // need burnRate > 6 but < 14.4
      // errorRate > 6 * 0.001 = 0.006 => goodRate < 0.994
      // Use goodRate = 0.991 => errorRate=0.009 => burnRate = 0.009/0.001 = 9
      const warmWindow: SLOMetricCounts = {
        goodCount: 991,
        totalCount: 1000,
        windowStart: NOW,
      };
      const result = monitor.checkSLO(
        "api_availability",
        warmWindow,
        warmWindow,
      );

      expect(result.alerts.some((a) => a.severity === "warning")).toBe(true);
      expect(result.alerts.some((a) => a.severity === "critical")).toBe(false);
    });

    it("does NOT fire alert when only one window exceeds threshold (multi-window rule)", () => {
      const monitor = new SLOMonitor();
      // Short window is hot, long window is fine — should not alert
      const hotShort: SLOMetricCounts = {
        goodCount: 970,
        totalCount: 1000,
        windowStart: NOW,
      };
      const coolLong: SLOMetricCounts = {
        goodCount: 9990,
        totalCount: 10000,
        windowStart: NOW,
      };
      const result = monitor.checkSLO("api_availability", hotShort, coolLong);
      expect(result.alerts).toHaveLength(0);
    });

    it("throws for unknown SLO name", () => {
      const monitor = new SLOMonitor();
      const counts: SLOMetricCounts = {
        goodCount: 100,
        totalCount: 100,
        windowStart: NOW,
      };
      expect(() =>
        monitor.checkSLO("nonexistent_slo", counts, counts),
      ).toThrow();
    });

    it("computes currentRate from shortWindowCounts", () => {
      const monitor = new SLOMonitor();
      const counts: SLOMetricCounts = {
        goodCount: 800,
        totalCount: 1000,
        windowStart: NOW,
      };
      const result = monitor.checkSLO(
        "workflow_execution_success",
        counts,
        counts,
      );
      expect(result.currentRate).toBeCloseTo(0.8, 5);
    });

    it("alert message includes SLO name and window info", () => {
      const monitor = new SLOMonitor();
      const hotWindow: SLOMetricCounts = {
        goodCount: 970,
        totalCount: 1000,
        windowStart: NOW,
      };
      const result = monitor.checkSLO("api_availability", hotWindow, hotWindow);
      expect(result.alerts.length).toBeGreaterThan(0);
      for (const alert of result.alerts) {
        expect(alert.message).toContain("api_availability");
        expect(alert.window).toBeTruthy();
      }
    });

    it("includes correct target in result", () => {
      const monitor = new SLOMonitor();
      const counts: SLOMetricCounts = {
        goodCount: 1000,
        totalCount: 1000,
        windowStart: NOW,
      };
      const result = monitor.checkSLO("api_availability", counts, counts);
      expect(result.target).toBe(0.999);
    });
  });

  describe("checkAll", () => {
    it("returns results for all SLOs present in countsMap", () => {
      const monitor = new SLOMonitor();
      const good: SLOMetricCounts = {
        goodCount: 1000,
        totalCount: 1000,
        windowStart: NOW,
      };
      const countsMap: Record<
        string,
        { short: SLOMetricCounts; long: SLOMetricCounts }
      > = {
        api_availability: { short: good, long: good },
        workflow_execution_success: { short: good, long: good },
      };
      const results = monitor.checkAll(countsMap);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.sloName).sort()).toEqual([
        "api_availability",
        "workflow_execution_success",
      ]);
    });

    it("skips SLOs not present in countsMap", () => {
      const monitor = new SLOMonitor();
      const good: SLOMetricCounts = {
        goodCount: 1000,
        totalCount: 1000,
        windowStart: NOW,
      };
      const results = monitor.checkAll({
        api_availability: { short: good, long: good },
      });
      expect(results).toHaveLength(1);
    });

    it("returns empty array for empty countsMap", () => {
      const monitor = new SLOMonitor();
      const results = monitor.checkAll({});
      expect(results).toHaveLength(0);
    });

    it("aggregates alerts from all checked SLOs", () => {
      const monitor = new SLOMonitor();
      // Both SLOs are burning hot
      const hot: SLOMetricCounts = {
        goodCount: 970,
        totalCount: 1000,
        windowStart: NOW,
      };
      const results = monitor.checkAll({
        api_availability: { short: hot, long: hot },
        workflow_execution_success: { short: hot, long: hot },
      });
      const totalAlerts = results.reduce((sum, r) => sum + r.alerts.length, 0);
      expect(totalAlerts).toBeGreaterThan(0);
    });
  });
});
