/**
 * SLO Monitor — evaluates current metrics against SLO burn-rate thresholds.
 *
 * Implements multi-window, multi-burn-rate alerting per SRE Workbook Chapter 5:
 * an alert fires only when BOTH the short and long windows exceed the threshold.
 */

import {
  ATLASIT_SLOS,
  errorBudgetRemaining,
  type SLODefinition,
} from "./slo.js";

export interface SLOMetricCounts {
  goodCount: number;
  totalCount: number;
  windowStart: string; // ISO timestamp
}

export interface SLOCheckResult {
  sloName: string;
  target: number;
  currentRate: number;
  budgetRemaining: number; // 0–1 fraction
  alerts: SLOAlert[];
}

export interface SLOAlert {
  severity: "critical" | "warning";
  burnRate: number;
  actualBurnRate: number;
  window: string;
  message: string;
}

/**
 * Compute the actual burn rate for a given window.
 *
 * actualBurnRate = errorRate / errorBudget
 *               = (1 - goodCount/totalCount) / (1 - target)
 */
function computeBurnRate(target: number, counts: SLOMetricCounts): number {
  if (counts.totalCount === 0) return 0;
  const errorRate = 1 - counts.goodCount / counts.totalCount;
  const errorBudget = 1 - target;
  if (errorBudget === 0) return 0;
  return errorRate / errorBudget;
}

export class SLOMonitor {
  private readonly definitions: ReadonlyArray<SLODefinition>;

  constructor(definitions: SLODefinition[] = ATLASIT_SLOS) {
    this.definitions = definitions;
  }

  /** Return all SLO names known to this monitor. */
  sloNames(): string[] {
    return this.definitions.map((d) => d.name);
  }

  /**
   * Evaluate a single SLO against short and long window metric counts.
   *
   * An alert is emitted for a threshold only when the actual burn rate
   * exceeds that threshold in BOTH windows (multi-window rule).
   */
  checkSLO(
    sloName: string,
    shortWindowCounts: SLOMetricCounts,
    longWindowCounts: SLOMetricCounts,
  ): SLOCheckResult {
    const definition = this.definitions.find((d) => d.name === sloName);
    if (definition === undefined) {
      throw new Error(`Unknown SLO: "${sloName}"`);
    }

    const { target, burnRateThresholds } = definition;

    const currentRate =
      shortWindowCounts.totalCount === 0
        ? 1
        : shortWindowCounts.goodCount / shortWindowCounts.totalCount;

    const budgetRemaining = errorBudgetRemaining(
      target,
      shortWindowCounts.goodCount,
      shortWindowCounts.totalCount,
    );

    const shortBurnRate = computeBurnRate(target, shortWindowCounts);
    const longBurnRate = computeBurnRate(target, longWindowCounts);

    const alerts: SLOAlert[] = [];

    for (const threshold of burnRateThresholds) {
      const shortExceeds = shortBurnRate > threshold.burnRate;
      const longExceeds = longBurnRate > threshold.burnRate;

      if (shortExceeds && longExceeds) {
        // Use the short window burn rate as the "actual" for reporting
        alerts.push({
          severity: threshold.severity,
          burnRate: threshold.burnRate,
          actualBurnRate: shortBurnRate,
          window: `${threshold.shortWindow}/${threshold.longWindow}`,
          message:
            `${sloName}: ${threshold.severity} burn rate exceeded ` +
            `(${Math.round(shortBurnRate * 10) / 10}x) in ` +
            `${threshold.shortWindow}/${threshold.longWindow}`,
        });
      }
    }

    return { sloName, target, currentRate, budgetRemaining, alerts };
  }

  /**
   * Evaluate all SLOs that have entries in countsMap.
   * SLOs without entries are silently skipped.
   */
  checkAll(
    countsMap: Record<
      string,
      { short: SLOMetricCounts; long: SLOMetricCounts }
    >,
  ): SLOCheckResult[] {
    const results: SLOCheckResult[] = [];

    for (const [sloName, { short, long }] of Object.entries(countsMap)) {
      const definition = this.definitions.find((d) => d.name === sloName);
      if (definition === undefined) continue; // skip unknown SLOs

      results.push(this.checkSLO(sloName, short, long));
    }

    return results;
  }
}
