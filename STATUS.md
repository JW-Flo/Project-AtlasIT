# AtlasIT Platform Status

**Last updated:** March 2026

## Current State

- **Test suite:** 356 tests passing (49/49 files)
- **Package manager:** pnpm (workspace monorepo)
- **Platform:** Cloudflare Workers + D1 + KV + R2 + Queues

## Phase Completion

| Phase | Status | PR | Key Deliverables |
|-------|--------|-----|------------------|
| 0 — Foundation | ✅ Complete | — | 3 workers deployed, D1 schemas, shared types, Vitest harness |
| 1 — Workflow Durability + Auth | ✅ Complete | #139 | Shared workflow types, EvidenceEmitter, queue dispatch, DLQ, D1 RBAC, shared auth middleware |
| 2 — MCP Orchestration | ✅ Complete | #140 | Compensation dispatch, per-step timeouts, Slack MCP agent, HMAC verification, e2e tests |
| 3 — Marketplace & Integrations | ✅ Pre-existing | — | Marketplace API, connector schema, adapter gen, Google Workspace/Okta connectors, credential vault, feature flags |
| 4 — Hardening & Production | ✅ Complete | #141 | Okta SCIM 2.0, k6 load tests, IaC drift detection (OPA), OIDC worker, CF-native observability |

## Deployed Workers

| Worker | Purpose |
|--------|---------|
| `onboarding` | Tenant provisioning |
| `ai-orchestrator` | Workflow execution, event routing, queue consumer |
| `compliance-worker` | Compliance scoring, policy evaluation, evidence |
| `core-api` | Central API: tenants, events, agents, flags, credentials |
| `documentation-worker` | Docs serving |
| `slack-notification-agent` | Outbound Slack notifications via MCP events |

## Infrastructure

- **D1:** `ATLAS_SHARED_DB` (tenants, users, compliance, audit, console_user_roles, directory)
- **KV:** `KV_SESSIONS`, `KV_CACHE`, `KV_FEATURE_FLAGS`, `MCP_STORE`
- **R2:** `atlasit-evidence` (policies, evidence, artifacts)
- **Queues:** `atlasit-step-tasks` (workflow step dispatch)

## What's Built

- Console app (SvelteKit + Tailwind, CF Pages)
- D1-backed RBAC (CF Access JWT → roles from D1, fallback to viewer)
- Shared auth middleware (core-api, ai-orchestrator)
- WorkflowDO (Durable Object): state machine, compensation, per-step timeouts, DLQ escalation
- Event router with fan-out, agent registry, HMAC signature verification
- MCP agent SDK (`packages/mcp-sdk`)
- Evidence locker (R2-backed, SHA-256 content addressing)
- Policy evaluation engine (Rego-based)
- Rate limiting + security headers middleware
- Credential vault (AES-GCM envelope encryption)
- Feature flag system (KV-backed, rollout %, tenant overrides)
- Okta adapter with SCIM 2.0 provisioning
- k6 load tests (smoke/load/stress/soak)
- IaC drift detection (OPA/Conftest policies, GH Actions)
- CF Workers-native observability (W3C traceparent tracer, Analytics Engine metrics)
- Structured logging with SLO definitions and burn-rate alerting
