# AtlasIT Architecture

Status: Draft (initial commit)
Last Updated: 2026-04-19
Owner: JW-Flo

## 1. Executive Summary

AtlasIT is a modular, multi-tenant IT automation and lifecycle management platform. Core capabilities: identity & entitlement modeling, policy-driven provisioning/deprovisioning, standardized connector framework, auditable workflows, vendor assurance (TPRM), trust center operations, and exposure management with protocol support (OAuth/OIDC, SAML, SCIM) delivered via an edge-first architecture.

## 2. High-Level Architecture

Layers:

1. Edge / API Gateway: Cloudflare Workers entrypoint, request auth, tenant resolution, rate limiting.
2. Auth & Protocol Services: OAuth2/OIDC issuer, SAML SP (ACS + metadata), SCIM (Users & Groups), session management, JWKS publication.
3. Core Domain Services: Identity (canonical user graph), Tenant config, Policy & Entitlements Engine, Attribute Mapping Engine.
4. Workflow Orchestrator: State machine executing provisioning / deprovisioning tasks with retries & compensation.
5. Connector Framework: Registry + runtime + uniform interface for SaaS connectors (user create/update/deactivate, group ops, license ops, health check).
6. Data & State: Primary relational store (initially D1/SQLite; roadmap to Postgres), KV/Redis (hot config & token cache), object storage (audit export), queue/event bus (initial: DB polling, later: durable queue).
7. Observability & Compliance: Structured logs, metrics, traces (OTel), audit hash chain, webhook/event sink.
8. Security & Secrets: Encryption (envelope), secret storage, key rotation, tenant isolation enforcement.
9. Developer Platform: Connector SDK, CLI scaffolding, test harness, (future) marketplace & sandbox runtime (WASM).

10. Vendor Assurance Engine: Third-party inventory, tiering, owner workflows, questionnaire orchestration, and evidence collection lifecycle.
11. Trust Center Service: Controlled evidence publishing, request/approval gating, watermarking, and access analytics.
12. Exposure Scanner: Domain/subdomain discovery, TLS/DNS/header/port posture checks, external asset inventory, and finding normalization.
13. Risk Scoring Engine: Correlates identity, vendor, and exposure findings into a unified risk model feeding CDT and remediation workflows.

## 2.1 Strategic Module Topology (2026 Expansion)

```
External Assets ──> Exposure Scanner ──> Findings Normalizer ─┐
                                                              │
Vendors/Third Parties ─> Vendor Assurance Engine ─> Evidence ─┼─> Risk Scoring Engine ─> CDT State
                                                              │
Identity & JML Events ────────────────────────────────────────┘
                                      │
                                      ├─> Trust Center (gated evidence sharing, lineage, analytics)
                                      └─> Orchestrator (approval workflows, remediation, reassessment)
```

## 3. Component Responsibilities

- Identity Service: Canonical user record, attribute merge, external account references.
- Policy Engine: Evaluates rules (CEL/minimal DSL) to derive entitlements & connector actions.
- Attribute Mapping Engine: Transforms internal user model to connector schemas via mapping DSL (JMESPath subset target).
- Workflow Orchestrator: Executes ordered/parallel task graph; retry/backoff, compensation on failure, emits audit events.
- Connector Runtime: Executes connector modules with standardized context, handles rate limiting, pagination, error normalization.
- Audit Service: Append-only event log with hash chain integrity; digest notarization (Beta).
- Secrets Manager: Manages encrypted secrets (API tokens, client credentials) with rotation jobs.
- SCIM Server: Standards-compliant ingress for user/group lifecycle.
- SAML Service: Multi-tenant SAML SP for admin SSO; assertion validation to signed session/JWT.
- OAuth/OIDC Service: Client registration, token issuance (access/refresh/ID), JWKS rotation & publishing.

- Vendor Assurance Engine: Maintains vendor system-of-record, reassessment cadences, control questionnaire lifecycle, and approval workflows.
- Trust Center Service: Publishes policy/evidence packages with evidence lineage, watermarked downloads, gated access, and audit logs.
- Exposure Scanner: Runs continuous external attack-surface scans and maps findings to controls and remediation playbooks.
- Risk Scoring Engine: Produces weighted vendor/exposure/compliance risk scores and pushes deltas to orchestration rules.

## 4. Data Model (Key Entities)

Tables / Collections (conceptual):

- tenants (id, name, status, created_at)
- tenant_settings (tenant_id, key, value)
- users (id, tenant_id, primary_email, status, created_at)
- user_attributes (user_id, key, value, source)
- connector_versions (name, version, manifest, checksum)
- tenant_connectors (id, tenant_id, connector_name, version, config_ref, enabled)
- connector_user_accounts (id, user_id, connector_name, external_id, status, last_sync_at)
- workflows (id, name, type, definition, version)
- workflow_runs (id, workflow_id, trigger_type, status, started_at, completed_at)
- tasks (id, workflow_run_id, type, connector_name, status, attempt, started_at, completed_at, error_code)
- policy_rules (id, tenant_id, expression, actions_json, priority, enabled)
- attribute_mappings (id, tenant_id, connector_name, mapping_json, version)
- entitlements (id, tenant_id, connector_name, kind, value)
- entitlement_assignments (id, user_id, entitlement_id, status)
- audit_events (seq, tenant_id, actor, action, target, prev_hash, record_hash, timestamp)
- secrets (id, tenant_id, purpose, cipher_text, created_at, rotated_at)
- oauth_clients (id, tenant_id, name, client_id, client_secret_ref, grant_types, redirect_uris)
- saml_configs (id, tenant_id, entity_id, acs_url, metadata_xml, cert_ref, enabled)
- scim_tokens (id, tenant_id, token_hash, created_at, last_used_at, revoked)

Audit Hash Chain: record_hash = hash(json_event); audit_events.prev_hash references previous event's cumulative hash; chain_head persisted per tenant.

## 5. Reference Flows

A. SCIM User Create

1. SCIM POST /Users → SCIM Server validates & normalizes.
2. Identity Service upserts user + attributes.
3. Policy Engine evaluates rules → entitlement delta.
4. Workflow Orchestrator creates provisioning workflow_run.
5. Tasks enqueued (parallelizable by connector). Each task: mapping transform → connector API call → external_id stored.
6. Audit events emitted at each step; final success triggers webhook.

B. Deprovision (User termination)

1. Status change triggers policy re-evaluation (expected entitlements now empty).
2. Workflow orchestrator runs deprovision tasks (license removal, group removal, deactivate user accounts).
3. Audit & completion webhook.

C. SAML Admin Login

1. IdP sends SAMLResponse to ACS.
2. Validate signature + assertions → create admin session (JWT) with roles.
3. Admin UI uses session to call management APIs.

D. Connector Task Execution

1. Task picked up → mapping engine builds payload.
2. Connector runtime executes action; handles rate-limit/retry.
3. Updates connector_user_accounts or entitlements; emits audit.

## 6. Security Model (MVP Baseline)

- All API calls require tenant-scoped auth (OAuth token or signed session cookie).
- JWT key rotation every 30 days, JWKs endpoint cached.
- Secrets stored encrypted (AES-GCM) with KMS-managed data key; rotation job scheduled.
- Strict tenant_id predicate enforcement at DAL layer.
- Input validation schemas (Zod/TypeBox) at all ingress points.
- Least-privilege service tokens for outbound connectors.
- Rate limiting per tenant + IP for auth & SCIM endpoints.

## 7. Observability Strategy

Phase 1 (POC): Structured JSON logs, basic counters (provision_success, provision_failure), latency histogram for workflow duration.
Phase 2 (MVP): OpenTelemetry traces across edge → orchestrator → connector tasks; metrics exported (p95 task latency, task_retry_count). Webhook delivery metrics.
Phase 3 (Beta): SLOs (p95 SCIM create→provision < 120s), anomaly detection for spike in failures, hash chain integrity verification alerts.

## 8. Workflow Orchestrator Details

- Representation: DAG (stored as JSON definition) with node types (connector_task, decision, parallel, compensation).
- Execution: Initially linear + simple parallel groups; persisted task records; polling worker (DB) → transition to queue-based dispatch at Beta.
- Retry Policy: Exponential backoff (base 2s, max 2m, cap 6 attempts) except terminal errors (4xx not retryable unless 429).
- Compensation: For partial failure, previously successful tasks with defined compensators run reverse operations (e.g., created account then failed license assignment → on rollback disable account).

## 9. Policy & Mapping

MVP Policy Expression: Simple comparisons (==, !=) and logical AND; future: OR, IN list, attribute presence. Evaluated using safe CEL subset or custom parser.
Example Rule:
{
"if": "department == 'Sales' && country == 'US'",
"actions": [
{"type": "assign_group", "connector": "slack", "value": "sales-team"},
{"type": "assign_license", "connector": "google_workspace", "sku": "BUSINESS_STANDARD"}
]
}
Mapping DSL: Key = external field, value = internal path or expression (JMESPath subset) e.g. {"email":"user.primary_email","display_name":"concat(user.first_name,' ',user.last_name)"}.

## 10. Connector Framework

Manifest Fields: name, version, capabilities[], auth (type, scopes), rateLimits, mappings (default), configSchema.
Interface (TypeScript sketch):
export interface Connector {
provisionUser(ctx, user): Promise<Result>;
updateUser(ctx, user, changes): Promise<Result>;
deactivateUser(ctx, externalRef): Promise<Result>;
addUserToGroup(ctx, externalUserId, group): Promise<Result>;
removeUserFromGroup(ctx, externalUserId, group): Promise<Result>;
healthCheck(): Promise<Health>;
}
Packaging: Versioned, checksum verified; sandbox (Beta) executes untrusted connectors in WASM isolate.

## 11. Testing Strategy Overview

- Unit: Policy evaluation, mapping, connector stubs.
- Contract: Connector harness with mock external endpoints (fixtures for Slack/Google/GitHub).
- Integration: End-to-end provisioning workflow simulation.
- Resilience: Fault injection (429, 5xx, timeouts) to validate retries & compensation.
- Security: Static analysis (semgrep), dependency vulnerability scan, secret scan.
- Performance: Workflow duration benchmarks (p95 target).

## 12. Roadmap Link

See docs/product-roadmap.md for phased delivery plan.

## 13. Open Decisions

- Backend language for orchestrator heavy logic (stay TS vs introduce Go for concurrency).
- Queue evolution path (DB polling → durable queue provider).
- Policy engine implementation detail (CEL vs custom DSL transpilable to AST).
- WASM sandbox feasibility within Workers constraints.
- Risk model weighting strategy across identity, vendor, and exposure signals.

## 14. Risks & Mitigations (Summary)

| Risk                    | Mitigation                                        |
| ----------------------- | ------------------------------------------------- |
| CI workflow instability | Canary job + alert on missing triggers            |
| Connector API drift     | Nightly healthCheck + manifest validation         |
| Tenant data leak        | Automated cross-tenant access tests in CI         |
| Audit tampering         | Hash chain + external digest notarization         |
| Over-engineering early  | Phase gating (sandbox & marketplace only at Beta) |

## 15. Glossary

- Connector: Adapter implementing provisioning interface for an external SaaS.
- Entitlement: Group/license/resource assignment derived from policy.
- Workflow Run: Execution instance of a provisioning/deprovisioning DAG.
- Mapping DSL: Expression rules translating internal attributes to connector schema.
- Hash Chain: Cryptographic chaining of audit records for tamper detection.

---

Feedback & updates: open an issue with label architecture.
