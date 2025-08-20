# Product Roadmap

Status: Draft (initial commit)
Last Updated: 2025-08-20
Owner: JW-Flo
Related: docs/architecture.md

## Overview
This roadmap operationalizes the architecture (docs/architecture.md) into phased delivery. Phases are incremental; each has explicit goals, scope boundaries, exit criteria, success metrics, and decision checkpoints. Risk linkage references Architecture Section 14.

Phases:
- Phase 0 (POC)
- Phase 1 (MVP)
- Phase 2 (Beta)

## Phase 0 (POC)
Goal: Demonstrate end-to-end automated user provisioning via SCIM → policy evaluation → workflow → single reference connector, with auditable events.

In Scope:
- Core data schema (tenants, users, user_attributes, connector_user_accounts, workflows, workflow_runs, tasks, audit_events, secrets minimal)
- Tenant-scoped auth (basic OAuth/OIDC skeleton: static signing key, JWKS endpoint)
- SCIM Users (create/update) minimal (no Groups yet)
- Policy Engine MVP (AND + ==/!= comparisons only)
- Attribute Mapping Engine subset (direct field + concat of first/last name)
- Workflow Orchestrator (linear tasks + retry/backoff, no parallel groups yet)
- Connector Framework skeleton + 1 reference connector (Slack recommended) implementing provisionUser, deactivateUser, healthCheck
- Audit event emission + hash chain computation (append-only, stored prev_hash + record_hash)
- Secrets storage wrapper (in DB with encryption envelope, manual key config)
- Observability Phase 1: structured JSON logs, counters (provision_success, provision_failure), workflow duration histogram

Out of Scope / Deferred:
- Groups in SCIM
- Parallel workflow execution
- License/group entitlements (focus on account create/deactivate)
- Key rotation automation
- OpenTelemetry tracing
- WASM sandbox for connectors

Exit Criteria:
- Create → provision → audit → deactivate flow succeeds for test user within < 5 minutes p95
- Hash chain validates for sequence of >20 events with no integrity breaks
- Slack connector healthCheck returns healthy indicator
- At least one negative provisioning attempt retried according to policy then succeeds

Key Metrics (baseline captured):
- p95 SCIM POST /Users → final task complete latency
- provision_success vs provision_failure counts
- Average retries per task (should be < 1.2 at small scale)
- Audit chain validation pass rate (100% required)

Decision Checkpoints:
- Confirm Slack as reference connector vs alternative (Google Workspace)
- Validate minimal policy DSL sufficiency for next phase (need OR? IN?)

Risks & Mitigations (link):
- Connector API drift (Ref Section 14) – nightly healthCheck planned for MVP
- Over-engineering avoidance – strictly limit scope above

## Phase 1 (MVP)
Goal: Production-capable multi-tenant platform supporting core provisioning/deprovisioning with entitlements (groups/licenses), improved reliability & observability.

In Scope:
- SCIM Groups + group membership deltas
- Parallel workflow groups (simple fan-out/fan-in)
- Additional connector actions: addUserToGroup, removeUserFromGroup
- Policy Engine extensions (OR, attribute presence; possibly IN list if low complexity)
- Mapping DSL extension (conditional expressions, basic string functions)
- Entitlement model (entitlements + entitlement_assignments tables) & evaluation
- Secrets rotation job (time-based)
- JWT key rotation every 30 days
- OpenTelemetry traces across edge → orchestrator → connector tasks
- Metrics expansion: p95 task latency, task_retry_count, workflow_failure_rate
- Webhook delivery for provisioning completion
- Incident hygiene process (triage tagging, runbooks skeleton)

Out of Scope / Deferred:
- WASM sandbox execution
- Marketplace / connector publishing pipeline
- Durable external queue (still DB polling)

Exit Criteria:
- p95 SCIM create → provision latency < 120s for 3 connectors under nominal load
- Retry-induced success rate improvement (≤ 5% of tasks reach terminal failure)
- Secrets older than rotation period are rotated automatically
- Trace sampling available (head-based or ratio) with span linkage through at least 2 connectors
- Webhook success delivery rate ≥ 99% (with retry strategy for failures)

Key Metrics (targets):
- p95 task latency < 10s
- workflow_failure_rate < 2%
- Average retries per successful task < 0.5
- Secret rotation compliance 100%

Decision Checkpoints:
- Queue evolution timing (decide if Beta requires external durable queue)
- Policy engine backing implementation (continue custom vs adopt CEL subset)

Risks & Mitigations:
- Tenant data leak – automated cross-tenant access tests in CI (Ref Section 14)
- Audit tampering – hash chain periodic verification job

## Phase 2 (Beta)
Goal: Harden platform for broader external adoption: scalability, integrity guarantees, connector extensibility.

In Scope:
- Durable queue/event bus (e.g., Cloudflare Queues or external managed service)
- Full DAG workflow representation (decision nodes, compensation execution path)
- WASM sandbox for untrusted connectors (resource limits, timeouts)
- Marketplace publishing metadata (manifest validation pipeline)
- Advanced Policy features (IN lists, nested logical groups) if not earlier
- Mapping DSL richer functions (substring, toUpper, conditional ternary)
- Audit digest notarization (periodic external anchoring)
- Anomaly detection for provisioning failure spikes
- SLO dashboard (p95 latency, failure budget burn)
- Connector SDK packaging + CLI scaffolding tool

Out of Scope:
- GA-level multi-region failover (post-Beta)
- Full RBAC fine-grained admin roles (post-Beta unless required by early adopters)

Exit Criteria:
- Sustained load: 10x POC volume with stable p95 latency < 150s
- Queue throughput meets target (documented) with zero data loss in failure tests
- WASM sandbox executes at least 2 third-party connectors safely (no host escape in tests)
- Audit digest verification passes for ≥ 30 days history
- Failure spike detection alert fired & acknowledged in a simulated incident drill

Key Metrics:
- Queue enqueue→start latency p95 < 5s
- Sandbox execution timeout rate < 1%
- Audit notarization success rate 100%

Decision Checkpoints:
- GA readiness assessment criteria met? (Stability, security posture, support load)
- Evaluate need to split services (introduce Go service for orchestrator) based on CPU/time metrics

Risks & Mitigations:
- Queue migration complexity – dual-write pilot period
- Sandbox feasibility within Workers constraints – early performance profiling

## Backlog / Future (Post-Beta)
- Multi-region active-active
- Fine-grained admin RBAC roles
- Advanced analytics & reporting
- Connector marketplace billing & usage metering
- Machine learning anomaly scoring (beyond rules)

## Work Item Mapping (Initial Set)
(Reference for issue creation – will evolve.)
1. Roadmap document (this file)
2. Core data schema & migrations
3. Tenant auth & OIDC skeleton
4. Observability Phase 1
5. Policy Engine MVP
6. Attribute Mapping Engine subset
7. Workflow Orchestrator (linear)
8. Connector Framework + Slack reference connector
9. SCIM Users + minimal
10. Audit events & hash chain
11. Secrets storage & encryption wrapper
12. Incident issue consolidation

## Governance & Updates
- Update cadence: weekly during POC, bi-weekly afterward.
- Any scope change requires noting rationale + impact in a Changelog section appended below.

## Changelog
- 2025-08-20: Initial draft created.