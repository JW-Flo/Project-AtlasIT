# AtlasIT Platform Foundation

Status: Current
Owner: Platform Engineering
Last Updated: 2026-03-16

## Purpose

Codify the foundational architecture, phases, and governance model for the compliance, evidence, and policy subsystems. This document complements `roadmap.md`, `POLICY_AND_EVIDENCE.md`, and the OpenAPI specification.

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

## Phase Overview

1. Foundation Hardening ✅
2. Compliance Snapshot v1 ✅ (cached snapshot persisted in D1/R2)
3. Evidence Layer ✅ (ingest, search, evaluate, R2-backed evidence locker with SHA-256 content addressing)
4. Policy Evaluation ✅ (Rego-based engine, 5 compliance frameworks: SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR)
5. Observability & Retention ✅ (W3C traceparent tracing, Analytics Engine metrics, SLO burn-rate alerting, structured logging)
6. Hardening & Rollout ✅ (Rate limiting, security headers, k6 load tests, IaC drift detection, OIDC worker)

See `ROADMAP.md` for the platform-level phase tracking (Phases 0–4 complete, Phase 5 next).

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

## Observability (Current Metrics)

| Metric                           | Type      | Purpose                                    | Emission Source      |
| -------------------------------- | --------- | ------------------------------------------ | -------------------- |
| `request_duration_ms{endpoint}`  | Histogram | Latency SLO tracking                       | Structured logs      |
| `request_errors_total{endpoint}` | Counter   | Error rate monitoring                      | Structured logs      |
| `snapshot_age_seconds`           | Gauge     | Freshness of persisted compliance snapshot | `/health` response   |
| `evidence_count`                 | Gauge     | Indexed evidence total                     | `/health` response   |
| `evidence_ingest_total`          | Counter   | Evidence volume trend                      | `metrics.flush` logs |
| `bundle_total_bytes`             | Gauge     | Performance guardrail                      | CI perf workflow     |

## Health Endpoint Evolution

Baseline response (2025-10-01):

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

Future extensions: include per-endpoint p95 latency sample and most recent evidence hash digest for audit sampling.

## Retention Strategy (Summary)

Detailed matrix lives in `DATA_RETENTION_MATRIX.md`.

| Artifact           | Retention                 | Rationale                        |
| ------------------ | ------------------------- | -------------------------------- |
| EvidenceEnvelope   | Indefinite (immutable)    | Historical audit reproducibility |
| ComplianceSnapshot | Rolling 400 days          | Year + comparison window         |
| Raw Logs           | 30 days (exported longer) | Cost control                     |
| Metrics Aggregates | 90 days                   | Performance trend analysis       |

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
