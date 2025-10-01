# AtlasIT Platform Foundation

Status: Draft
Owner: Platform Engineering
Last Updated: 2025-09-30

## Purpose

Codify the foundational architecture, phases, and governance model for the compliance, evidence, and policy subsystems. This document complements `roadmap.md`, `POLICY_AND_EVIDENCE.md`, and future OpenAPI specifications.

## Architectural Alignment

| Dimension     | Decision                                                                            | Rationale                                                                 |
| ------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Runtime       | Cloudflare Workers (edge)                                                           | Low latency, global distribution, zero warm concerns for bursty workloads |
| Persistence   | D1 (structured) + R2 (immutable evidence blobs) + KV (ephemeral caches)             | Separation of concerns: relational indexing vs. binary durability         |
| Multi-Tenancy | Logical row scoping (`tenant_id` column/field on all persisted + response payloads) | Enables isolation, future billing metering                                |
| Contracts     | OpenAPI first, type generation second, implementation last                          | Prevents drift and enables contract tests                                 |
| Logging       | Structured JSON with correlation (`X-Request-ID`)                                   | Machine parseable, supports analytics lake ingestion                      |
| Hashing       | SHA-256 canonical JSON                                                              | Deterministic reproducibility / audit chain                               |
| Evolution     | Append-only, additive fields, soft deprecations                                     | Backwards compatibility for 2 major versions                              |

## Phase Overview (See roadmap for table)

1. Foundation Hardening
2. Compliance Snapshot v1
3. Evidence Layer Skeleton
4. Policy Evaluation MVP
5. Observability & Retention
6. Hardening & Rollout

Each phase produces measurable exit criteria to prevent scope bleed.

## Data Model Primitives

| Primitive          | Description                                                      | Source of Truth              |
| ------------------ | ---------------------------------------------------------------- | ---------------------------- |
| ComplianceSnapshot | Aggregated framework coverage + risks + policies                 | D1 (persisted snapshot rows) |
| EvidenceEnvelope   | Immutable evaluation artifact bundle                             | R2 object (hash key)         |
| PolicyPack         | Versioned collection of evaluation rules                         | D1 `policy_packs` table      |
| Risk               | Normalized risk with severity, likelihood, impact, derived score | D1 `risks`                   |

## Risk Model

Formula: `score = likelihood * impact` (integer 1–25). Severity mapping (initial heuristic):

| Score Range | Derived Severity |
| ----------- | ---------------- |
| 1–5         | low              |
| 6–10        | medium           |
| 11–16       | high             |
| 17–25       | critical         |

Manual severity overrides allowed but flagged for governance review (future).

## OpenAPI Workflow

1. Author or modify spec in `docs/api/openapi.yaml`.
2. Run `npm run openapi:verify` (structure + required paths).
3. Generate / update types (manual for now; codegen later).
4. Implement endpoints.
5. Add / update integration tests.
6. Update changelog if breaking or schema additive.

## Observability (Planned Metrics)

| Metric                               | Type      | Purpose                                    |
| ------------------------------------ | --------- | ------------------------------------------ |
| request_duration_ms{endpoint,method} | Histogram | Latency SLO tracking                       |
| request_errors_total{endpoint}       | Counter   | Error rate monitoring                      |
| snapshot_age_seconds                 | Gauge     | Freshness of persisted compliance snapshot |
| evidence_writes_total                | Counter   | Volume trend / capacity planning           |
| evidence_hash_mismatch_total         | Counter   | Integrity breach detection                 |
| policy_eval_duration_ms              | Histogram | Performance tuning target                  |

## Health Endpoint Evolution

Baseline: `{ status, service, timestamp, version }`

Planned extended fields:

```json
{
  "status": "ok",
  "service": "compliance-worker",
  "version": "1.0.0",
  "snapshot": { "ageSeconds": 42, "lastHash": "sha256:..." },
  "d1": { "reachable": true, "latencyMs": 12 },
  "r2": { "reachable": true },
  "sla": { "p95LatencyMs": 120 },
  "build": { "gitSha": "abcdef1" }
}
```

## Retention Strategy (Summary)

Detailed matrix lives in `DATA_RETENTION_MATRIX.md`.

| Artifact           | Retention                            | Rationale                        |
| ------------------ | ------------------------------------ | -------------------------------- |
| EvidenceEnvelope   | Indefinite (legal/audit)             | Historical audit reproducibility |
| ComplianceSnapshot | Rolling 400 days                     | Year + comparison window         |
| Raw Logs           | 30 days (exported externally longer) | Cost control                     |
| Metrics Aggregates | 90 days                              | Performance trend analysis       |

## Governance Gates

| Gate                   | Trigger              | Enforcement                           |
| ---------------------- | -------------------- | ------------------------------------- |
| Contract change        | Spec diff            | CI workflow requires CHANGELOG update |
| Risk model tweak       | Score mapping change | Requires ADR or decision log entry    |
| Performance regression | p95 > threshold      | Build fails (perf script)             |

## Future Enhancements

- Evidence Merkle tree + external notarization
- Streaming policy evaluation traces for debugging
- Tenant-scoped API tokens with fine-grained scopes
- Envelope compression (if average size > 64KB)

---

Document will be versioned; changes summarized in repository CHANGELOG when impacting runtime behavior.
