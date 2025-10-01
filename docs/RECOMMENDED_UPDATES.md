# Project AtlasIT Recommended Updates (Autonomous Prompt Alignment)

Status: Draft (Generated YYYY-MM-DD)

## 1. Source-of-Truth Summary

This document consolidates repository audit results, live UI feature inventory, implementation gaps, and planned remediation actions required to fully satisfy the autonomous engineering prompt (JML workflows, policy generation/evaluation, control coverage, integrity & retention, RBAC scope, observability, OpenAPI consistency).

## 2. Live UI Pages Audited

Pages analyzed: /dashboard, /it/policies, /it/backup, /security, /enhanced-security-scanner, /api-manager, /onboarding, /marketplace, /orchestrator, /workflows plus 404 probes (/evidence, /coverage, /compliance, /health, /admin).

Observed core UI patterns:

- KPI Tiles: compliance score, security score, workflow counts
- Policy Library: cards with status (generated/customizable)
- Security Scanner: vulnerability table + compliance grid (✓ / ⚠ / ✖)
- Marketplace: integration catalog (Connected / Not Connected)
- Workflow Lists: status (Active/Draft/Inactive), recent executions
- Onboarding Wizard: multi-step AI-assisted (company, persona, review)
- Orchestrator: workflow creation form & active execution list

Missing (recommended additions):

- Evidence Explorer UI (filter by hash, pack, control mapping)
- Coverage Dashboard (framework selection, % mapped controls, unmapped controls list, newly linked evidence)
- Retention / Integrity Admin Panel (policy purge preview, integrity verification hash check results)
- Latency & Health Metrics Panel (p50/p95 for workflowExecute, policyGenerate, policyEvaluate; counters)
- Control-Evidence Link Management (manual override/attach evidence)

## 3. Backend Feature Implementation Status

| Capability                          | Present                       | Gap                                | Action                                                                         |
| ----------------------------------- | ----------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| JML Workflow Execution (idempotent) | Yes                           | Tests absent                       | Add execution determinism tests                                                |
| Policy Template Generation          | Yes                           | Determinism test                   | Hash-based fixture tests                                                       |
| Policy Evaluation                   | Yes                           | Latency instrumentation missing    | Add histogram timings                                                          |
| Control Coverage Endpoint           | Partial (query param variant) | Path mismatch vs spec              | Support path /api/v1/policies/coverage/{framework} & deprecate query style     |
| Evidence Ingest + Index             | Yes                           | Integrity verify implemented       | DONE                                                                           |
| Evidence→Control Linking            | Heuristic auto-link           | Manual link endpoint unimplemented | Implement /controls/{controlKey}/evidence-link                                 |
| Retention (Policies)                | Config implied                | Purge endpoint missing             | Add /admin/retention/policies/purge                                            |
| Health Metrics                      | Basic counts                  | Missing latency & extended counts  | Add histogram & counts (policy templates, generated policies, controls, links) |
| OpenAPI 1.2.0 Spec                  | Exists                        | Drift vs implementation            | Reconcile + version bump if schema changes                                     |
| RBAC (KV tokens)                    | Yes                           | Test coverage absent               | Add isolation tests                                                            |

## 4. Required New Endpoints

1. GET /api/v1/evidence/{hash}/verify (IMPLEMENTED)
   - Output (implemented): { hash, recomputedHash, integrity, tenantId, pack, subject, createdAt, sizeBytes }
2. POST /api/v1/admin/retention/policies/purge (IMPLEMENTED)
   - Body: { dryRun?: boolean }
   - Returns: { dryRun, retentionDays, cutoff, candidates, deleted }
3. POST /api/v1/controls/{controlKey}/evidence-link
   - Body: { evidenceHash }
   - Validates existence & inserts/upserts link
4. (Planned Harmonization) GET /api/v1/policies/coverage/{framework}
   - Still pending; query param variant active.
5. NEW: Security Incidents & Activity (IMPLEMENTED):
   - GET /api/v1/security/incidents (list)
   - POST /api/v1/security/incidents (create demo)
   - POST /api/v1/security/incidents/{id}/resolve (resolve)
   - GET /api/v1/security/status (summary)
   - GET /api/v1/activity (unified feed)
   - GET /api/v1/notifications (critical/high open subset)
6. JML Demo Metadata & Redirects (IMPLEMENTED):
   - GET /api/v1/workflows/demo/jml
   - Redirects: /jml, /jml-demo, /jml/demo -> /api/v1/workflows/demo/jml

## 5. Observability Enhancements

Add lightweight histogram implementation (fixed buckets) for operations:

- workflowExecute
- policyGenerate
- policyEvaluate

Expose in health: {
latency: {
workflowExecute: { p50, p95, count }, ...
}, counts: { policyTemplates, generatedPolicies, controls, evidence, controlEvidenceLinks }
}

Maintain backward compatibility by augmenting current JSON.

## 6. Data Integrity & Retention

- Integrity: Recompute canonical JSON hash of stored evidence object (R2) vs index hash.
- Retention: Purge generated_policies older than (now - RETENTION_DAYS_POLICIES) where not referenced by latest evaluation (future enhancement: retain last N per template).
- Logging: Emit structured audit events { action: "retention.policies.purge", deleted, cutoff }.

## 7. Testing Strategy

Test Categories:

1. Workflows
   - Idempotency: same payload + idempotency key yields same execution id & steps.
   - Step Status Ordering: Completed timestamps monotonic.
2. Policies
   - Deterministic Generation: identical context hash produces identical canonical doc hash.
   - Evaluation Hash Stability: evaluation output hashed & reproducible.
3. Coverage
   - Evidence ingest increases mapped control count when heuristic triggers.
   - Manual link endpoint increments controlEvidenceLinks.
4. Evidence Integrity
   - Corrupt simulated R2 object -> verify returns integrity=false.
5. Retention
   - Seed policies with age strata; dryRun returns expected counts; purge deletes only older than cutoff.
6. RBAC
   - Access denied without required role; cross-tenant isolation for workflows & policies.
7. Health & Metrics
   - Latency histograms produce non-zero p50/p95 after synthetic calls.

## 8. Migration & Versioning Plan

- Add migration 0004_observability.sql if schema additions needed (likely none if only existing tables used).
- OpenAPI: If new schemas introduced (IntegrityVerificationResult, RetentionPurgeResult), bump to 1.3.0.
- CHANGELOG: Document Added/Changed/Deprecated sections.

## 9. Documentation Updates Required

Files to update:

- docs/DATA_RETENTION_MATRIX.md: Add generated policies retention rule.
- docs/COMPLIANCE_SNAPSHOT.md: Reference integrity verification.
- docs/AtlasIT Development Guide.md: Include latency metrics collection & test matrix.
- docs/api/openapi.yaml: Add endpoints & schemas, coverage path variant, mark deprecated query variant.
- Root README.md: Link to this summary and highlight upcoming 1.3.0 features.

## 10. Risk & Mitigation

| Risk                               | Impact               | Mitigation                                  |
| ---------------------------------- | -------------------- | ------------------------------------------- |
| Spec Drift Persists                | Client breakage      | Implement endpoints before next release tag |
| Histogram Overhead                 | Worker CPU           | Use coarse buckets & sample threshold       |
| Retention Deletes Needed Artifacts | Compliance audit gap | Dry-run default & explicit confirmation     |
| Integrity Endpoint Latency         | R2 fetch cost        | Cache recent verification results (TTL 5m)  |

## 11. Execution Order (Recommended)

1. Implement integrity endpoint
2. Implement manual evidence link endpoint
3. Add latency metrics instrumentation
4. Implement retention purge endpoint
5. Augment health & coverage path variant
6. Update OpenAPI & bump version
7. Write full test suite
8. Update docs & changelog

## 12. Acceptance Checklist

- [ ] All four new endpoints implemented & tested
- [ ] Latency metrics visible in /health
- [ ] Integrity verification returns integrity=true for pristine sample
- [ ] Retention dryRun produces accurate counts
- [ ] OpenAPI 1.3.0 published with no unimplemented endpoints
- [ ] Tests cover all categories with ≥1 assertion each
- [ ] CHANGELOG has Unreleased and 1.3.0 sections

## 13. Extended Roadmap (New Additions)

### Unified Activity & Notifications

- Endpoint: `GET /api/v1/activity` (merged events: workflows, policies, security_incident, access_request, integration_event)
- Endpoint: `GET /api/v1/notifications` (filter: type, priority, since, cursor)
- Endpoint: `GET /api/v1/security/incidents` (type=security_incident, priority>=high)
- Health metrics: `activityCount`, `pendingAccessRequests`

### Access Request Automation

- Table: `access_requests` (status: pending -> approved -> fulfilled / denied)
- Endpoints:
  - `POST /api/v1/access/requests` create
  - `GET /api/v1/access/requests?status=pending` list
  - `POST /api/v1/access/requests/{id}/approve`
  - `POST /api/v1/access/requests/{id}/deny`
  - `POST /api/v1/access/requests/{id}/fulfill`
- Slack approval simulation endpoint (future): `POST /api/v1/integrations/slack/approval`

### Security Incidents Pane

- Specialized query surfaces incidents with enriched fields: severity, actor, targets, remediationActions.
- Future correlation: map incident → related evidence hashes.

### Marketplace Integration Notifications

- Integration events normalized into activity (source="integration:&lt;key&gt;").
- Prevents siloed notification panels per integration.

### Slack / ChatOps Workflow

- Outbound message templates for approval & incident notifications.
- Signature verification placeholder to be hardened (HMAC + timestamp window).

### UI Mapping (Future Frontend Work)

- Notifications Center page (filters: priority, type, timeframe)
- Security Center incidents sub-tab (real-time poll / SSE candidate)
- Access Requests widget (approve/deny inline; auto-refresh)
- Activity stream component reused across dashboard & compliance pages.

### Testing Additions

- Activity ingestion & pagination
- Access request lifecycle transitions
- Security incident filtering correctness
- Notification priority filtering

### Versioning Impact

- OpenAPI 1.4.0 candidate if new schemas (ActivityEvent, AccessRequest, SecurityIncident) exceed minor scope of 1.3.0.

---

Generated to prevent loss of alignment context. Update as items are delivered.
