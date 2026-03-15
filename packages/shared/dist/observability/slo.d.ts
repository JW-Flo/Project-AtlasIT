/**
 * SLO definitions and burn-rate alerting for AtlasIT.
 *
 * Based on SRE Workbook Chapter 5: multiwindow, multi-burn-rate alerting.
 * Backed by Cloudflare Workers Logs + Analytics Engine.
 */
export interface SLODefinition {
    name: string;
    description: string;
    target: number;
    window: "30d" | "7d";
    sli: SLIDefinition;
    burnRateThresholds: BurnRateThreshold[];
}
export interface SLIDefinition {
    good: string;
    total: string;
    unit: "requests" | "workflows" | "evidence_ingests";
}
export interface BurnRateThreshold {
    severity: "critical" | "warning";
    burnRate: number;
    shortWindow: string;
    longWindow: string;
}
export declare const ATLASIT_SLOS: SLODefinition[];
/**
 * Calculate error budget remaining.
 * @returns fraction of budget remaining (1.0 = full, 0.0 = exhausted)
 */
export declare function errorBudgetRemaining(target: number, goodCount: number, totalCount: number): number;
//# sourceMappingURL=slo.d.ts.map