# Observability Strategy

Status: Draft
Owner: Platform Engineering
Last Updated: 2025-09-30

## Objectives

1. Detect regressions (latency, error rate, freshness) before customers do.
2. Provide audit-quality traceability (correlation IDs) across workers.
3. Maintain performance budgets to prevent silent bloat.

## Core Signals

| Signal                        | Source                     | Granularity  | Usage                        |
| ----------------------------- | -------------------------- | ------------ | ---------------------------- |
| Request Latency (p50/p95/p99) | Structured log aggregation | Per endpoint | SLO enforcement              |
| Error Rate (5xx %)            | Structured logs            | Per endpoint | Alert triggers               |
| Snapshot Age                  | Compliance worker          | Gauge        | Freshness monitoring         |
| Evidence Write Failures       | Compliance + R2 ops        | Counter      | Integrity risk detection     |
| Bundle Size Delta             | Build script               | Per build    | Prevent frontend regressions |

## SLO Targets (Initial)

| Endpoint                      | p95 Latency    | Error Rate (rolling 15m) |
| ----------------------------- | -------------- | ------------------------ |
| /api/compliance/snapshot      | < 150ms (edge) | < 1%                     |
| /api/policy/evaluate (future) | < 90ms         | < 1%                     |
| /health                       | < 50ms         | < 0.1%                   |

Breaches trigger: log event `slo.violation` + CI perf gate on subsequent build if reproducible.

## Logging & Correlation

- All responses include `X-Request-ID`.
- Downstream fetches must forward existing `X-Request-ID` (or generate once at ingress).
- Log schema:

```json
{
  "ts": "2025-09-30T12:00:00.000Z",
  "level": "info",
  "event": "snapshot.success",
  "requestId": "uuid",
  "durationMs": 42,
  "tenantId": "t_demo"
}
```

## Metrics Extraction (Phase 1)

Lightweight: derive metrics from logs (no duplicate instrumentation). Future: Workers Analytics Engine histograms.

## Performance Budgets

| Category                   | Budget   | Gate                    |
| -------------------------- | -------- | ----------------------- |
| Console main bundle (gzip) | <= 250KB | CI fail if > +15% delta |
| Snapshot p95 (uncached)    | <= 150ms | Performance test script |
| Policy evaluate p95        | <= 90ms  | Perf script (Phase 4)   |

## Alerting (Future)

- Threshold-based (latency/error) exported to external monitoring (placeholder).
- Snapshot age > 6h logs `snapshot.stale` warning.

## Health Endpoint Extension (Planned Fields)

| Field                     | Type   | Description                        |
| ------------------------- | ------ | ---------------------------------- |
| snapshot.ageSeconds       | number | Age of latest persisted snapshot   |
| evidence.count (optional) | number | Total evidence envelopes indexed   |
| perf.snapshot.p95         | number | Derived latency sample (synthetic) |

## Synthetic Checks

- Script will hit `/api/compliance/snapshot` 25 times sequentially at deploy and record distribution.
- Outlier detection (basic): flag if p95 > budget \* 1.25.

## Change Log

| Date       | Change                     |
| ---------- | -------------------------- |
| 2025-09-30 | Initial observability plan |
