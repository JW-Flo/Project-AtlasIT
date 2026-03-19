# AtlasIT Platform — QA Audit & Development Roadmap

**Last updated:** March 2026 | **Version:** 2.0

---

## 1. Executive Summary

The AtlasIT platform has completed Phases 0–4 of its development roadmap. The monorepo contains 356 tests across 49 files with full coverage of shared packages, workers, adapters, and infrastructure. All core services are deployed and operational.

---

## 2. Module Maturity Assessment

| Module | Code | Tests | Deploy | Verdict |
|--------|------|-------|--------|---------|
| Core API (`core-api/`) | ✅ | ✅ | ✅ | Hono app: tenants, events, agents, flags, credentials, DLQ |
| AI Orchestrator (`ai-orchestrator/`) | ✅ | ✅ | ✅ | WorkflowDO, event routing, queue consumer, DLQ |
| Compliance Worker (`compliance-worker/`) | ✅ | ✅ | ✅ | Evidence-grounded scoring, evidence collection, policy eval (stub) |
| Onboarding (`onboarding/`) | ✅ | ✅ | ✅ | Tenant provisioning |
| Console App (`console-app/`) | ✅ | ✅ | ✅ | SvelteKit + Tailwind on CF Pages |
| Slack Agent (`slack-notification-agent/`) | ✅ | ✅ | ✅ | MCP event → Slack webhook |
| OIDC Exchange (`ops/oidc/`) | ✅ | ✅ | ✅ | GitHub JWT → 1Password Connect, rate limiting |
| Okta Adapter (`adapters/okta/`) | ✅ | ✅ | — | Directory sync, webhooks, SCIM 2.0 provisioning |
| Google Workspace (`adapters/google-workspace/`) | ✅ | ✅ | — | OAuth 2.0, user/group sync |
| Shared Package (`packages/shared/`) | ✅ | ✅ | — | Auth, middleware, logging, observability, platform adapters |
| MCP SDK (`packages/mcp-sdk/`) | ✅ | ✅ | — | Client + server, HMAC signing |
| Connector Schema (`packages/connector-schema/`) | ✅ | — | — | Zod validation for connector manifests |
| Adapter Generator (`packages/adapter-gen/`) | ✅ | ✅ | — | Research → scaffold → compile pipeline |
| Terraform/IaC (`terraform/`) | ✅ | ✅ | — | OPA policies, drift detection, state validation |

## 3. Test Coverage

- **356 tests** across **49 test files**
- **Test harness:** Vitest + Miniflare (`vitest.workspace.ts`)
- **Test types:** Unit (node), Workers runtime (`@cloudflare/vitest-pool-workers`), load (k6)
- **Areas covered:** Auth middleware, compliance scoring, workflow state machine, SCIM endpoints, OIDC exchange, event routing, MCP SDK, observability, evidence emitter, DLQ, feature flags, credential vault, OPA policies

## 4. Security Posture

- ✅ HMAC signature verification on event ingestion
- ✅ D1-backed RBAC (console_user_roles, fallback to viewer)
- ✅ CF Access JWT authentication
- ✅ Rate limiting middleware (KV-backed, per-endpoint)
- ✅ Security headers middleware (CSP, HSTS, X-Frame-Options)
- ✅ Credential vault (AES-GCM envelope encryption)
- ✅ OIDC exchange worker (GitHub JWT validation, repo/org allowlists)
- ✅ Secrets via 1Password (vault: AWW_SHARED) + wrangler secret put

## 5. Observability

- ✅ Structured JSON logging with correlation IDs
- ✅ W3C traceparent distributed tracing (`cf-tracer.ts`)
- ✅ Analytics Engine metrics emitter (`cf-metrics.ts`)
- ✅ SLO definitions with burn-rate alerting
- ✅ Health endpoints on all workers

## 6. Infrastructure as Code

- ✅ Terraform modules for Cloudflare resources
- ✅ OPA/Conftest policies (KV naming, D1 location, R2 public access, security)
- ✅ GitHub Actions drift detection workflow (daily + PR trigger)
- ✅ State validation script (`scripts/validate-tf-state.mjs`)

## 7. Load Testing

- ✅ k6 scripts for core-api, orchestrator, compliance-worker
- ✅ Four scenarios: smoke, load, stress, soak
- ✅ SLO-based thresholds

## 8. Phase Completion

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| 0 — Foundation | ✅ | Workers deployed, D1 schemas, shared types, Vitest harness |
| 1 — Workflow Durability + Auth | ✅ (PR #139) | Shared workflow types, EvidenceEmitter, queue dispatch, DLQ, D1 RBAC |
| 2 — MCP Orchestration | ✅ (PR #140) | Compensation dispatch, per-step timeouts, Slack MCP agent, HMAC, e2e tests |
| 3 — Marketplace & Integrations | ✅ | Marketplace API, connectors, credential vault, feature flags |
| 4 — Hardening & Production | ✅ (PR #141) | Okta SCIM, k6 load tests, IaC drift detection, OIDC worker, CF observability |
| 5 — Adapter Scaffolding | ✅ (PR #158, #159) | 33 adapters: registry, manifests, scaffolds, 9 core-tier implementations, CI/CD |
| 6 — Contract Stability & Auth Hardening | ✅ (PR #164, #165) | RBAC expansion, DTO normalization, safeProxyFetch, startup assertions |
| 7 — Compliance-as-Automation | ✅ | 53 CDT rules, evidence classifier/locker, JML auto-evidence, 40+ control mappings |
| 7.5 — Compliance Integration | ⚠️ In Progress | Scoring unified, scheduled evidence collection, CDT twin expanded. **Remaining:** twin KV bridge, policy eval, remediation catalog |
| 8 — Access Reviews | Future | Campaign creation, manager review UI, auto-revoke, evidence generation |
| 9 — Trust Center | Future | Public compliance portal, PDF export |

## 9. Compliance System Integration Audit (March 2026)

The compliance system has three disconnected evaluation paths discovered during deep code audit:

| Path | What It Does | Where Scores Live | Used By UI? |
|------|-------------|-------------------|-------------|
| **A: UI-Driven** | ~~Manual checklist~~ → Now proxies to Path B | `compliance_scores` (via compliance-worker) | ✅ Yes — unified via Phase 7.5 |
| **B: Evidence-Grounded** | Queries `compliance_evidence` for recency/count per control | Returned from `GET /api/v1/cdt/evaluate` | ✅ Yes — console scores endpoint reads from this |
| **C: CDT Twin** | Evaluates CdtEvent payloads against all 53 rule functions | KV (`STATE_NS`) + R2 (`EVIDENCE_BUCKET`) | ❌ No — still isolated, nothing reads KV |

### Gap Resolution Status

| # | Gap | Status | Resolution |
|---|-----|--------|------------|
| 1 | UI scoring reads manual checklist, not real evidence | ✅ **Resolved** | Console scores endpoint now calls compliance-worker CDT evaluate |
| 2 | `storeEvidence()` never called | ✅ **Was already wired** | Orchestrator `events.ts` classifies + stores every event via `waitUntil` |
| 3 | CDT twin runs 7 of 53 rules | ✅ **Resolved** | Twin now uses `ALL_CONTROL_IDS` (53 rules) exported from engine |
| 4 | CDT twin KV state invisible to platform | ⬚ **Open** | KV state still not bridged to `compliance_evidence` |
| 5 | No scheduled evidence collection | ✅ **Resolved** | Orchestrator cron Duty 2 collects adapter evidence for all tenants |
| 6 | `evaluatePolicy()` is a hash stub | ⬚ **Open** | Policy evaluation remains aspirational |

### What Works End-to-End Now

- Event → `classifyEvent()` → `storeEvidence()` → `compliance_evidence` D1 + R2 (every event)
- Adapter evidence collection on cron schedule (Duty 2, every 5 min, all tenants)
- `compliance_evidence` → CDT evaluate → weighted scores → `compliance_scores` → UI dashboard
- CDT twin evaluates all 53 rules across 5 frameworks
- WorkflowDO + queue consumer + step executor (fully functional)
- JML auto-trigger: `user.created`/`user.deactivated` → provision/deprovision workflows
- Manual evidence upload with SHA-256 hashing and control linking

---

See `STATUS.md` for current deployment state, `ROADMAP.md` for upcoming phases, and `CLAUDE.md` for coding standards.
