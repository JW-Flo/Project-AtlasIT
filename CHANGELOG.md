# Changelog

All notable changes to this project will be documented in this file. The format is based on Keep a Changelog and adheres to semantic versioning.

## [Unreleased]

### Fixed

- Corrected malformed D1 query chaining in policies retention purge handler; now properly binds parameters and measures latency (`policiesRetentionPurge`).

### Added / Hardened

- `parseControlRef()` utility for robust control reference parsing — fixes bug where ISO-27001 and NIST-CSF adapter evidence was silently stored with wrong framework/controlId values due to naïve `indexOf("-")` split (`packages/shared/src/evidence/adapter-collector.ts`)
- Adapter pass/fail status now affects compliance scoring — controls with failing adapter evidence (e.g. MFA not enforced) are capped at `in_progress` instead of being promoted to `implemented` by recency alone (`compliance-worker/src/modules/policies/cdt-rules.ts`)
- Score recalculation trigger after scheduled evidence collection — scores refresh automatically when new adapter evidence is ingested (`ai-orchestrator/src/index.ts`)
- Daily comprehensive compliance re-evaluation cron (`0 2 * * *`) evaluates all frameworks for all tenants (`ai-orchestrator/wrangler.toml`)
- Evidence coverage indicators in compliance dashboard — controls tab shows per-control evidence count badges, aggregate coverage summary, and "Gap" indicators for controls lacking evidence (`console-app compliance page`)
- Enhanced policy template value sanitization: line ending normalization, length cap (5000 chars + ellipsis), added escaping for backticks and backslashes to reduce injection / template breakout risk.
- Access Requests frontend page `/access-requests` (now under `console-app`) with create + approve/deny/fulfill workflow, pagination, status filtering, optimistic transitions & toasts.
- Incidents frontend page `/incidents` (console-app) with create + resolve workflow, severity & status display, pagination (cursor-based).
- Access Requests & Incidents API client modules in `console-app/src/lib/api` consuming endpoints `GET/POST /api/v1/access-requests`, `POST /api/v1/access-requests/{id}/{approve|deny|fulfill}`, `GET/POST /api/v1/incidents`, `POST /api/v1/incidents/{id}/resolve`.
- Focused console lint script `npm run lint:console` replacing prior `lint:web` (atlasit-web now deprecated).

### Planned / In Progress

- Fix: Executor duplicate runState retrieval & typo (applied, will ship in next release).
- Add: Evidence integrity verification endpoint `GET /api/v1/evidence/{hash}/verify`.
- Add: Policies retention purge endpoint `POST /api/v1/admin/retention/policies/purge` with dry-run support.
- Add: Manual control evidence link endpoint `POST /api/v1/controls/{controlKey}/evidence-link` (currently spec drift; implementation pending).
- Add: Latency histograms (workflowExecute, policyGenerate, policyEvaluate) surfaced via `/health`.
- Add: Coverage path variant `GET /api/v1/policies/coverage/{framework}` (deprecate query param form in future version).
- Add: JML demo metadata endpoint `GET /api/v1/workflows/demo/jml` (documentation helper, non-executing).
- Add: Legacy JML demo redirects `/jml-demo`, `/jml`, `/jml/demo` -> `/api/v1/workflows/demo/jml`.
- Add: Security incidents endpoints: list `GET /api/v1/security/incidents`, create `POST /api/v1/security/incidents`, resolve `POST /api/v1/security/incidents/{id}/resolve`.
- Add: Security status summary `GET /api/v1/security/status`.
- Add: Unified activity feed `GET /api/v1/activity`.
- Add: Notifications subset `GET /api/v1/notifications` (high priority open incidents).
- Add: Extended health counts (policyTemplateCount, generatedPolicyCount, controlCount, controlEvidenceLinks) actual implementation alignment.
- Docs: New `docs/RECOMMENDED_UPDATES.md` consolidating audit & roadmap.
- Docs: Update retention and observability guides to reference integrity & latency metrics.
- Tests: Introduce determinism, idempotency, RBAC isolation, retention dry-run, integrity verification, coverage growth tests.

### Deprecated (Planned)

- Query string variant `GET /api/v1/policies/coverage?framework=` will be deprecated after path form stabilizes.

### Security (Preview)

- No known security-impacting pending changes. Integrity verification reduces undetected evidence tampering risk.

---

## [1.2.0] - 2025-10-01

### Added

- Policy template listing endpoint: `GET /api/policies/templates`.
- Policy generation endpoint: `POST /api/policies/generate` with deterministic context hashing & caching.
- Control coverage endpoint: `GET /api/policies/coverage/{framework}`.
- Control evidence link endpoint: `POST /api/controls/{controlKey}/evidence-link`.
- Extended /health metrics: `policyTemplateCount`, `generatedPolicyCount`, `controlCount`, `controlEvidenceLinks`.
- Documentation updates: POLICY_AND_EVIDENCE.md (templates, coverage, linking), DATA_RETENTION_MATRIX.md rows, OBSERVABILITY.md additions.
- Migration 0003 schema freeze marker.

### Changed

- OpenAPI spec version bumped from 1.1.0 to 1.2.0 with new schemas (PolicyTemplate, GeneratePolicyRequest/Response, CoverageSummary) and extended Health schema.

### Security

- No security-impacting changes in this release.

## [1.1.0] - 2025-09-30

### Added (baseline)

- AI inference endpoint with quota & rate limiting.
- Evidence ingest/search/retrieve endpoints.
- Compliance snapshot retrieval.
- Health endpoint base metrics.
