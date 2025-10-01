# Observability Strategy

Status: Draft
Owner: Platform Engineering
Last Updated: 2025-10-01

## Objectives

1. Detect regressions (latency, error rate, freshness) before customers do.
2. Provide audit-quality traceability (correlation IDs) across workers.
3. Maintain performance budgets to prevent silent bloat.

## Core Signals

| Signal                             | Source                     | Granularity  | Usage                               |
| ---------------------------------- | -------------------------- | ------------ | ----------------------------------- |
| Request Latency (p50/p95/p99)      | Structured log aggregation | Per endpoint | SLO enforcement                     |
| Error Rate (5xx %)                 | Structured logs            | Per endpoint | Alert triggers                      |
| Snapshot Age                       | Compliance worker          | Gauge        | Freshness monitoring                |
| Evidence Ingest Count              | Compliance worker          | Counter      | Volume tracking / anomaly detection |
| Evidence Write Failures            | Compliance + R2 ops        | Counter      | Integrity risk detection            |
| Bundle Size Delta                  | Build script               | Per build    | Prevent frontend regressions        |
| AI Daily Quota Used                | Orchestrator /health       | Daily        | Capacity planning & quota guard     |
| AI Daily Quota Remaining           | Orchestrator /health       | Daily        | Proactive throttling UI             |
| AI IP Burst Rejections             | Orchestrator logs          | Event        | Abuse detection / tuning            |
| AI Rate Limit Config               | Orchestrator /health       | Config       | Observability of window/burst       |
| AI Quota Placeholders (compliance) | Compliance /health         | Gauge        | Backward compatible placeholders    |

## SLO Targets (Initial)

| Endpoint                      | p95 Latency    | Error Rate (rolling 15m) |
| ----------------------------- | -------------- | ------------------------ |
| /api/compliance/snapshot      | < 150ms (edge) | < 1%                     |
| /api/evidence/search          | < 150ms        | < 1%                     |
| /health                       | < 50ms         | < 0.1%                   |
| /api/policy/evaluate (future) | < 90ms         | < 1%                     |

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

Evidence ingest emits `evidence.ingest` (with `stored` boolean) and counters flush via `metrics.flush` log entries.

## Metrics Extraction (Phase 1)

Lightweight: derive metrics from logs (no duplicate instrumentation). Future: Workers Analytics Engine histograms.

## Additions (Version 1.2.0)

New /health fields (see OpenAPI 1.2.0):

| Field                | Type    | Description                               |
| -------------------- | ------- | ----------------------------------------- |
| policyTemplateCount  | integer | Count of rows in `policy_templates`       |
| generatedPolicyCount | integer | Count of rows in `generated_policies`     |
| controlCount         | integer | Count of rows in `internal_controls`      |
| controlEvidenceLinks | integer | Count of rows in `control_evidence_links` |

New log events:

- `policy.generate` (templateKey, cached, contextHash, durationMs)
- `control.link` (controlKey, evidenceHash, linked)
- `policy.coverage.query` (framework, durationMs)

Alerting Guidance:

- Sudden drop in `policyTemplateCount` ( >1 template removed ) → investigate seed logic regression.
- Rapid growth in `generatedPolicyCount` without corresponding tenant increases → potential context hash instability.
- `controlEvidenceLinks` stagnation over time may indicate adoption friction (inform product team).

Planned (Not Yet Implemented):

- Histogram for policy generation latency.
- Coverage trend export via scheduled job.

## Metrics Inventory

| Metric                     | Type    | Purpose                                    | Emission Source         |
| -------------------------- | ------- | ------------------------------------------ | ----------------------- |
| `snapshot_age_seconds`     | Gauge   | Freshness of persisted compliance snapshot | `/health` query         |
| `evidence_count`           | Gauge   | Indexed evidence total                     | `/health` query         |
| `evidence_ingest_total`    | Counter | Evidence ingest volume trend               | `evidence.ingest` logs  |
| `evidence_ingest_failures` | Counter | R2/D1 write failures                       | `evidence.*.error` logs |
| `request_duration_ms`      | Sample  | Latency SLO tracking                       | Structured logs         |
| `bundle_total_bytes`       | Gauge   | Frontend bundle size guardrail             | CI `bundle-report` step |

## Performance Budgets

| Category                   | Budget   | Gate                    |
| -------------------------- | -------- | ----------------------- |
| Console main bundle (gzip) | <= 250KB | CI fail if > baseline   |
| Snapshot p95 (uncached)    | <= 150ms | Performance test script |
| Policy evaluate p95        | <= 90ms  | Perf script (Phase 4)   |

## Alerting (Future)

- Threshold-based (latency/error) exported to external monitoring (placeholder).
- Snapshot age > 6h logs `snapshot.stale` warning.
- Evidence ingest failure spike (>5 in 5m) emits `evidence.alert` log row.

## Health Endpoint Extension (Current Fields)

```json
{
  "status": "ok",
  "service": "compliance-worker",
  "version": "dev",
  "buildVersion": "2025.10.01+sha",
  "timestamp": 1700000000000,
  "snapshotAgeSeconds": 42,
  "d1": true,
  "r2": true,
  "evidenceCount": 12
}
```

### Orchestrator Health (AI)

```json
{
  "status": "healthy",
  "service": "orchestrator",
  "quota": { "date": "2025-10-01", "used": 5, "limit": 500, "remaining": 495 },
  "rateLimit": { "windowSeconds": 60, "burst": 10 }
}
```

## Synthetic Checks

- Script will hit `/api/compliance/snapshot` 25 times sequentially at deploy and record distribution.
- Outlier detection (basic): flag if p95 > budget \* 1.25.
- Post-deploy smoke workflow curls `/health`, `/api/compliance/snapshot`, `/api/evidence/search` across workers.dev + www.

## Change Log

| Date       | Change                                      |
| ---------- | ------------------------------------------- |
| 2025-10-01 | Added evidence metrics + post-deploy smoke. |
| 2025-09-30 | Initial observability plan                  |
