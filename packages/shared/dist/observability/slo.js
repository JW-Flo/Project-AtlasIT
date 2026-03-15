/**
 * SLO definitions and burn-rate alerting for AtlasIT.
 *
 * Based on SRE Workbook Chapter 5: multiwindow, multi-burn-rate alerting.
 * Backed by Cloudflare Workers Logs + Analytics Engine.
 */
export const ATLASIT_SLOS = [
    {
        name: "workflow_execution_success",
        description: "Workflow executions complete without terminal failure",
        target: 0.99,
        window: "30d",
        sli: {
            good: "workflow_runs WHERE status = 'completed'",
            total: "workflow_runs WHERE status IN ('completed', 'failed')",
            unit: "workflows",
        },
        burnRateThresholds: [
            { severity: "critical", burnRate: 14.4, shortWindow: "5m", longWindow: "1h" },
            { severity: "warning", burnRate: 3, shortWindow: "30m", longWindow: "6h" },
        ],
    },
    {
        name: "api_availability",
        description: "API requests return non-5xx responses",
        target: 0.999,
        window: "30d",
        sli: {
            good: "requests WHERE status < 500",
            total: "requests",
            unit: "requests",
        },
        burnRateThresholds: [
            { severity: "critical", burnRate: 14.4, shortWindow: "5m", longWindow: "1h" },
            { severity: "warning", burnRate: 6, shortWindow: "30m", longWindow: "6h" },
        ],
    },
    {
        name: "evidence_ingest_success",
        description: "Evidence ingests succeed and produce valid envelopes",
        target: 0.999,
        window: "30d",
        sli: {
            good: "evidence_ingests WHERE status = 'stored'",
            total: "evidence_ingests",
            unit: "evidence_ingests",
        },
        burnRateThresholds: [
            { severity: "critical", burnRate: 14.4, shortWindow: "5m", longWindow: "1h" },
            { severity: "warning", burnRate: 3, shortWindow: "30m", longWindow: "6h" },
        ],
    },
    {
        name: "compliance_snapshot_latency",
        description: "Compliance snapshot endpoint responds within 500ms p95",
        target: 0.95,
        window: "7d",
        sli: {
            good: "snapshot_requests WHERE duration_ms <= 500",
            total: "snapshot_requests",
            unit: "requests",
        },
        burnRateThresholds: [
            { severity: "critical", burnRate: 14.4, shortWindow: "5m", longWindow: "1h" },
            { severity: "warning", burnRate: 6, shortWindow: "30m", longWindow: "6h" },
        ],
    },
];
/**
 * Calculate error budget remaining.
 * @returns fraction of budget remaining (1.0 = full, 0.0 = exhausted)
 */
export function errorBudgetRemaining(target, goodCount, totalCount) {
    if (totalCount === 0)
        return 1.0;
    const currentRate = goodCount / totalCount;
    const errorBudget = 1 - target;
    const errorRate = 1 - currentRate;
    return Math.max(0, 1 - errorRate / errorBudget);
}
//# sourceMappingURL=slo.js.map