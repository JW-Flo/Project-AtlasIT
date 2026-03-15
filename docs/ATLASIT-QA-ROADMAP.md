# AtlasIT Platform — Full QA Audit & Development Roadmap

**Date:** 2026-03-15 | **Version:** 1.0 | **Classification:** Internal Engineering

---

## 1. Executive Summary

This document provides a comprehensive QA audit of the AtlasIT platform codebase and a prioritized development roadmap designed for direct execution by Claude Code. It covers every active module, identifies structural gaps, security concerns, and missing implementations, then prescribes concrete next steps with acceptance criteria.

> **Key Finding:** The monorepo has strong architectural foundations (Cloudflare Workers, MCP orchestration, Zero Trust posture, IaC scaffolding) but most services remain at README/placeholder stage. The critical path to a functional MVP requires wiring the Core API, standing up D1 schemas, and getting the MCP event loop operational. Security primitives (HMAC, mTLS, SOPS) are designed but not consistently deployed.

---

## 2. Full QA Audit

### 2.1 Module Maturity Assessment

| Module              | Code        | Tests   | Deploy      | Docs    | Verdict                       |
| ------------------- | ----------- | ------- | ----------- | ------- | ----------------------------- |
| MCP Worker (`mcp/`) | IN PROGRESS | ❌ NONE | IN PROGRESS | ✅      | Runs locally, no tests        |
| Onboarding Service  | IN PROGRESS | ❌ NONE | NOT STARTED | ✅      | Types + handlers written      |
| Orchestrator        | NOT STARTED | ❌ NONE | NOT STARTED | ✅      | README only                   |
| Marketplace         | NOT STARTED | ❌ NONE | NOT STARTED | ✅      | README only                   |
| CDT Service         | IN PROGRESS | ❌ NONE | NOT STARTED | ✅      | HMAC + mTLS designed          |
| GitHub Proxy        | ✅ DONE     | ❌ NONE | ✅ DONE     | ✅      | Deployed, needs tests         |
| Research Engine     | ✅ DONE     | ❌ NONE | IN PROGRESS | ✅      | CLI works, no CI              |
| Adapter Generator   | IN PROGRESS | ❌ NONE | NOT STARTED | PARTIAL | Template scaffold exists      |
| Terraform/IaC       | IN PROGRESS | ❌ NONE | NOT STARTED | ✅      | AWS module exists, CF partial |
| Secrets/OIDC        | IN PROGRESS | ❌ NONE | IN PROGRESS | ✅      | op-map + 1P workflow defined  |
| JW-Site (subtree)   | NOT STARTED | ❌ NONE | NOT STARTED | ✅      | Placeholder only              |

### 2.2 Critical Findings

| #   | Area                 | Finding                                                                                                                      | Severity    | Recommendation                                                                                                    |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | **Testing**          | Zero test files across the entire monorepo. No Vitest config, no test scripts in package.json, no CI test step.              | 🔴 CRITICAL | Add vitest to root, create test harness for Workers using miniflare, enforce coverage gates in CI.                |
| 2   | **D1 Schemas**       | Onboarding defines SQL in README but no migration files exist in any service. No shared schema tooling.                      | 🔴 CRITICAL | Create `shared/db/migrations/` with numbered `.sql` files. Add `wrangler d1 migrations apply` to deploy scripts.  |
| 3   | **CI/CD**            | GitHub Actions workflows reference 1Password and secret validation but no build/test/deploy pipeline exists for the Workers. | 🟠 HIGH     | Build `.github/workflows/deploy-workers.yml` with lint, type-check, test, and wrangler deploy stages per service. |
| 4   | **Auth**             | No JWT/session middleware implemented in any Worker. Onboarding service references auth but has no implementation.           | 🟠 HIGH     | Implement `shared/middleware/auth.ts` using Hono middleware pattern with JWT verification against KV-stored keys. |
| 5   | **MCP Event Loop**   | Orchestrator is README-only. No event router, no workflow engine, no state machine.                                          | 🟠 HIGH     | Implement core event router in `orchestrator/src/index.ts` using Hono + Durable Objects for stateful workflows.   |
| 6   | **Type Safety**      | Shared types exist in `onboarding/src/types.ts` but no shared package. Each service will diverge.                            | 🟡 MEDIUM   | Create `packages/shared-types/` with Zod schemas exported as npm workspace package.                               |
| 7   | **Observability**    | Health endpoints mentioned in READMEs but only GitHub Proxy actually implements `/health`.                                   | 🟡 MEDIUM   | Standardize health endpoint contract per SKILL.md governance. Add structured logging to all Workers.              |
| 8   | **Secrets Rotation** | 1Password Connect token rotation flagged as TODO. Service account deprecation checklist exists but is not actioned.          | 🟡 MEDIUM   | Execute `ops/secrets/TO_DO_SERVICE_ACCOUNT_DEPRECATION.md`. Switch to read-only Connect token.                    |
| 9   | **R2 Inventory**     | R2 bucket audit is placeholder-only. No object lifecycle policies verified.                                                  | 🟢 LOW      | Use S3-compatible CLI to audit R2 buckets. Confirm lifecycle rules match CDT evidence retention policy.           |
| 10  | **Adapter Gen**      | Template worker scaffold exists but no integration test verifying generated code compiles/deploys.                           | 🟢 LOW      | Add smoke test: generate adapter → tsc compile → wrangler dev --test → assert /health returns 200.                |

### 2.3 Security Posture Summary

- ✅ HMAC authentication designed for CDT service (not deployed/tested end-to-end)
- ✅ mTLS client certificate flow documented with SHA-256 fingerprint allowlisting (edge-only, no wrangler dev)
- ⚠️ OIDC exchange worker exists as template but not wired to GitHub Actions OIDC provider
- ❌ No CSP headers, no rate limiting middleware, no WAF rules in Terraform
- ✅ GitHub Proxy correctly strips Authorization headers and implements path allowlisting
- ✅ Secrets management via 1Password CLI well-documented with op-map.json

### 2.4 Architecture Gaps

- No API gateway or routing layer — each Worker is standalone
- No shared error handling — services will invent their own error response format
- No database connection pooling strategy for Postgres hybrid persistence
- No feature flag system despite adapter generator referencing `FEATURE_CONNECTOR_` env vars
- No structured logging format defined — services will produce incompatible log formats
- No API versioning strategy enforced despite Hono pattern showing `/api/v1/`
- Multi-tenant isolation designed but not implemented — D1 queries lack `tenant_id` scoping

---

## 3. Development Roadmap

### 3.1 Phase 1: Foundation (Weeks 1–3)

**Goal:** Core API running, D1 schemas deployed, shared types published, test harness operational.

| ID   | Task                                                                                            | Owner   | Status      | Target   |
| ---- | ----------------------------------------------------------------------------------------------- | ------- | ----------- | -------- |
| F-01 | Create `packages/shared-types` with Zod schemas for Tenant, User, Event, Integration, Config    | CodeGen | NOT STARTED | Week 1   |
| F-02 | Set up Vitest + Miniflare test harness at repo root with per-service test configs               | CodeGen | NOT STARTED | Week 1   |
| F-03 | Write D1 migration files: tenants, users, integrations, audit_log, onboarding_sessions          | CodeGen | NOT STARTED | Week 1   |
| F-04 | Implement `shared/middleware/auth.ts`: JWT verification, tenant context injection, RBAC check   | CodeGen | NOT STARTED | Week 1–2 |
| F-05 | Implement `shared/middleware/error-handler.ts`: structured error responses with correlation IDs | CodeGen | NOT STARTED | Week 1   |
| F-06 | Build Core API Worker (Hono): /health, /api/v1/tenants, /api/v1/auth/token, /api/v1/events      | CodeGen | NOT STARTED | Week 2   |
| F-07 | Wire onboarding service handlers to D1: replace placeholder logic with real queries             | CodeGen | NOT STARTED | Week 2   |
| F-08 | Create `.github/workflows/ci.yml`: lint, type-check, test, per-service matrix                   | CodeGen | NOT STARTED | Week 2   |
| F-09 | Create `.github/workflows/deploy-workers.yml`: wrangler deploy per service with env promotion   | CodeGen | NOT STARTED | Week 3   |
| F-10 | Add structured logging utility (`shared/utils/logger.ts`) with JSON output, correlation IDs     | CodeGen | NOT STARTED | Week 3   |
| F-11 | Write unit tests for auth middleware, error handler, and Core API tenant CRUD (≥80% coverage)   | CodeGen | NOT STARTED | Week 3   |

### 3.2 Phase 2: MCP Orchestration (Weeks 4–6)

**Goal:** Event-driven orchestration layer operational. MCP agents can register, receive events, and execute actions.

| ID   | Task                                                                                                   | Owner   | Status      | Target   |
| ---- | ------------------------------------------------------------------------------------------------------ | ------- | ----------- | -------- |
| M-01 | Implement event router in orchestrator/src: Hono + KV-based event queue with fan-out                   | CodeGen | NOT STARTED | Week 4   |
| M-02 | Build agent registry: D1 table for MCP agents with schema, capabilities, health status                 | CodeGen | NOT STARTED | Week 4   |
| M-03 | Implement Durable Object for workflow state machine: states, transitions, timeout handling             | CodeGen | NOT STARTED | Week 4–5 |
| M-04 | Build MCP agent SDK (`packages/mcp-sdk`): TypeScript client for agent registration + event consumption | CodeGen | NOT STARTED | Week 5   |
| M-05 | Create first MCP agent: Slack notification agent with incoming webhook integration                     | CodeGen | NOT STARTED | Week 5   |
| M-06 | Wire CDT service HMAC auth + event ingestion to orchestrator event bus                                 | CodeGen | NOT STARTED | Week 5–6 |
| M-07 | Implement dead letter queue pattern: failed events stored in D1 with retry metadata                    | CodeGen | NOT STARTED | Week 6   |
| M-08 | Add integration tests: event publish → agent pickup → workflow state transitions                       | CodeGen | NOT STARTED | Week 6   |

### 3.3 Phase 3: Marketplace & Integrations (Weeks 7–10)

**Goal:** SMB customers can browse connectors, install them, and configure integrations through the UI.

| ID   | Task                                                                                          | Owner   | Status      | Target   |
| ---- | --------------------------------------------------------------------------------------------- | ------- | ----------- | -------- |
| I-01 | Marketplace API: GET /apps, POST /install, DELETE /uninstall with D1 catalog                  | CodeGen | NOT STARTED | Week 7   |
| I-02 | Build connector schema (`packages/connector-schema`): Zod types for connector manifest        | CodeGen | NOT STARTED | Week 7   |
| I-03 | Implement adapter generator pipeline: research schema → scaffold → compile → deploy           | CodeGen | NOT STARTED | Week 7–8 |
| I-04 | Build Google Workspace connector: OAuth 2.0, user provisioning, group sync                    | CodeGen | NOT STARTED | Week 8   |
| I-05 | Build Okta SCIM connector: user lifecycle, group management, SAML SSO config                  | CodeGen | NOT STARTED | Week 8–9 |
| I-06 | Build React Marketplace UI: connector catalog, install wizard, config forms, status dashboard | Claude  | NOT STARTED | Week 9   |
| I-07 | Implement credential vault: envelope encryption, KV-stored encrypted API keys, rotation       | CodeGen | NOT STARTED | Week 9   |
| I-08 | Feature flag system: KV-based flags with tenant scoping, rollout %, kill switches             | CodeGen | NOT STARTED | Week 10  |
| I-09 | E2E test: install Slack connector → configure webhook → trigger event → verify delivery       | CodeGen | NOT STARTED | Week 10  |

### 3.4 Phase 4: Hardening & Production (Weeks 11–14)

**Goal:** Production-ready platform with security hardening, observability, and IaC automation.

| ID   | Task                                                                                            | Owner   | Status      | Target     |
| ---- | ----------------------------------------------------------------------------------------------- | ------- | ----------- | ---------- |
| H-01 | Rate limiting middleware: per-tenant, per-endpoint limits using CF Rate Limiting or KV counters | CodeGen | NOT STARTED | Week 11    |
| H-02 | CSP + security headers middleware for all Workers                                               | CodeGen | NOT STARTED | Week 11    |
| H-03 | Complete Terraform modules: Cloudflare Workers, D1, KV, R2 with env promotion                   | CodeGen | NOT STARTED | Week 11–12 |
| H-04 | Implement IaC drift detection: terraform plan in CI, fail on unexpected changes                 | CodeGen | NOT STARTED | Week 12    |
| H-05 | Execute 1Password service account deprecation checklist                                         | Manual  | NOT STARTED | Week 12    |
| H-06 | Wire OIDC exchange worker to GitHub Actions for credential-free CI deployments                  | CodeGen | NOT STARTED | Week 12    |
| H-07 | Build observability dashboard: Worker Analytics Engine metrics, error rates, latency P50/P99    | Claude  | NOT STARTED | Week 13    |
| H-08 | Penetration testing: OWASP top 10 against all API endpoints, fix findings                       | Manual  | NOT STARTED | Week 13    |
| H-09 | JW-Site subtree import: git subtree add, unify build config, extract shared auth                | CodeGen | NOT STARTED | Week 13    |
| H-10 | Load testing: k6 scripts against Core API and Orchestrator, establish baseline SLOs             | CodeGen | NOT STARTED | Week 14    |
| H-11 | Production deployment runbook: rollback procedures, incident response, on-call                  | Claude  | NOT STARTED | Week 14    |

---

## 4. Claude Code Execution Briefs

Each brief below is a self-contained prompt. Paste directly into Claude Code. They follow the work prompt format from the AtlasIT orchestrator skill and are ordered by dependency.

---

### Brief F-01: Shared Types Package

````
## Task: Create packages/shared-types

### Context
All AtlasIT services need consistent type definitions. Currently types are
scattered (onboarding/src/types.ts). We need a single source of truth as an
npm workspace package.

### Acceptance Criteria
- [ ] packages/shared-types/src/index.ts exports all schemas
- [ ] Zod schemas for: Tenant, User, Event, Integration, Config, HealthResponse, ApiError
- [ ] package.json with name @atlasit/shared-types, added to pnpm-workspace.yaml
- [ ] tsconfig extends root tsconfig.base.json
- [ ] Build script produces ESM + CJS outputs
- [ ] Each schema has .parse() and inferred TypeScript type export

### Implementation Guide
1. Create packages/shared-types/
2. Define Zod schemas matching onboarding/src/types.ts patterns
3. Add HealthResponse per SKILL.md governance (status, timestamp, version, checks)
4. Add ApiError with code, message, correlationId, details
5. Export both Zod schemas and inferred types
6. Wire into workspace: pnpm-workspace.yaml, root tsconfig references

### Code Scaffold
```typescript
import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  industry: z.string().optional(),
  status: z.enum(['active', 'suspended', 'onboarding']),
  config: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string(),
  checks: z.record(z.object({
    status: z.enum(['pass', 'fail', 'warn']),
    message: z.string().optional(),
  })).optional(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ApiErrorSchema = z.object({
  status: z.literal('error'),
  code: z.string(),
  message: z.string(),
  correlationId: z.string().uuid(),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
````

```

---

### Brief F-02: Test Harness Setup

```

## Task: Vitest + Miniflare Test Harness

### Context

Zero tests exist. We need a testing foundation that works with Cloudflare
Workers (V8 isolate runtime, D1 bindings, KV bindings).

### Acceptance Criteria

- [ ] Root vitest.config.ts with workspace-aware configuration
- [ ] @cloudflare/vitest-pool-workers configured for D1/KV/R2 test bindings
- [ ] Helper: createTestEnv() returns mock Hono context with D1/KV
- [ ] Helper: seedDatabase() runs migrations and inserts test fixtures
- [ ] Example test file proving D1 queries work in test environment
- [ ] npm scripts: test, test:watch, test:coverage at root and per-service
- [ ] Coverage thresholds: 80% statements, 70% branches

### Implementation Guide

1. pnpm add -Dw vitest @cloudflare/vitest-pool-workers miniflare
2. Create vitest.config.ts using @cloudflare/vitest-pool-workers
3. Create test/helpers/env.ts with createTestEnv()
4. Create test/helpers/db.ts with migration runner + fixtures
5. Write mcp/**tests**/health.test.ts as proof of concept
6. Add scripts to root package.json

```

---

### Brief F-05: Error Handler Middleware

```

## Task: Shared Error Handler Middleware

### Context

Every Worker needs consistent error responses. Without a shared handler,
each service will invent its own format, breaking client expectations.

### Acceptance Criteria

- [ ] shared/middleware/error-handler.ts exports errorHandler Hono middleware
- [ ] Catches all unhandled errors, returns structured ApiError response
- [ ] Generates UUID correlation ID per request
- [ ] Maps known error types: ValidationError → 400, AuthError → 401, NotFoundError → 404
- [ ] Unknown errors → 500 with generic message (no stack traces in production)
- [ ] Logs full error details with correlation ID via structured logger
- [ ] Custom error classes: AppError, ValidationError, AuthError, NotFoundError

### Implementation Guide

1. Create shared/middleware/error-handler.ts
2. Define custom error classes extending AppError base
3. Hono middleware: try/catch wrapper, error classification, response formatting
4. Use crypto.randomUUID() for correlation IDs
5. Create shared/middleware/**tests**/error-handler.test.ts

```

---

### Brief F-06: Core API Worker

```

## Task: Core API Worker Implementation

### Context

The Core API is the central nervous system. It handles auth, tenant
management, event publishing, and serves as the API gateway for the frontend.

### Acceptance Criteria

- [ ] Hono app: /health, /api/v1/auth/token, /api/v1/tenants CRUD, /api/v1/events POST
- [ ] Auth middleware verifying JWT from Authorization: Bearer <token>
- [ ] Tenant context middleware extracting tenant_id from JWT claims
- [ ] All D1 queries parameterized with .bind() — NEVER string interpolation
- [ ] Zod validation on all request bodies via @hono/zod-validator
- [ ] Responses: { status: 'success', data, timestamp, correlationId }
- [ ] Errors: { status: 'error', code, message, correlationId }
- [ ] wrangler.toml with D1, KV bindings for dev/staging/prod
- [ ] Health endpoint returns HealthResponse per governance contract (additive only)

### Implementation Guide

1. Create core-api/src/index.ts with Hono app
2. Import @atlasit/shared-types schemas for validation
3. Routes follow Hono + Zod pattern from orchestrator SKILL.md
4. Wire auth middleware from shared/middleware/auth.ts
5. Wire error handler from shared/middleware/error-handler.ts
6. wrangler.toml: [env.dev], [env.staging], [env.production]

### Code Scaffold

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { TenantSchema } from "@atlasit/shared-types";
import { authMiddleware } from "../shared/middleware/auth";
import { errorHandler } from "../shared/middleware/error-handler";

type Bindings = { DB: D1Database; KV: KVNamespace };
const app = new Hono<{ Bindings: Bindings }>();

app.use("*", errorHandler());
app.use("/api/*", authMiddleware());

app.get("/health", async (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get("/api/v1/tenants/:id", async (c) => {
  const { id } = c.req.param();
  const result = await c.env.DB.prepare("SELECT * FROM tenants WHERE id = ?")
    .bind(id)
    .first();
  if (!result)
    return c.json(
      { status: "error", code: "NOT_FOUND", message: "Tenant not found" },
      404,
    );
  return c.json({
    status: "success",
    data: result,
    timestamp: new Date().toISOString(),
  });
});

export default app;
```

```

---

### Brief M-01: Event Router

```

## Task: MCP Event Router Implementation

### Context

The orchestrator needs an event-driven core. Events flow from Core API and
external webhooks into a router that fans out to registered MCP agents.

### Acceptance Criteria

- [ ] POST /api/v1/events accepts typed events (Zod validated)
- [ ] Event stored in D1 events table with status: pending → processing → completed | failed
- [ ] Fan-out: match event.type to agent subscriptions in agent_registry table
- [ ] Delivery via fetch() to agent webhook URLs with HMAC signature
- [ ] Retry: exponential backoff, max 3 retries, dead letter after exhaustion
- [ ] Idempotency: Idempotency-Key header prevents duplicate processing (KV with 24h TTL)
- [ ] Metrics: event count, delivery latency, failure rate via Analytics Engine

### Implementation Guide

1. Create orchestrator/src/index.ts with Hono app
2. D1 tables: events, agent_registry, event_deliveries, dead_letter
3. Event handler: validate → store → fan-out → track delivery
4. HMAC signing: shared secret per agent, SHA-256 of payload body
5. Use waitUntil() for async delivery to avoid blocking response
6. Dead letter: after max retries, move to dead_letter with error context

```

---

### Brief M-03: Workflow State Machine (Durable Object)

```

## Task: Durable Object Workflow Engine

### Context

Complex workflows (onboarding, incident response, provisioning) need
stateful execution with timeout handling. Durable Objects provide
single-instance-per-ID guarantees with persistent storage.

### Acceptance Criteria

- [ ] WorkflowDO class extending DurableObject
- [ ] States: CREATED → RUNNING → WAITING → COMPLETED | FAILED | TIMED_OUT
- [ ] Step execution: ordered list of steps, each with handler, timeout, retry config
- [ ] Alarm-based timeouts: setAlarm() for step deadlines
- [ ] HTTP API on DO: POST /start, POST /step/{id}/complete, GET /status
- [ ] Compensating actions: on failure, execute rollback steps in reverse
- [ ] Persistence: workflow state in DO storage, audit trail in D1

### Implementation Guide

1. Create orchestrator/src/workflow-do.ts
2. Define WorkflowDefinition type: { steps: Step[], onFailure: Step[] }
3. Implement state transitions with validation (no invalid transitions)
4. Use alarm() for timeout detection
5. Expose HTTP interface via fetch() handler on the DO
6. Create first workflow: TenantOnboardingWorkflow

```

---

## 5. Task Dependency Graph

```

CRITICAL PATH (determines minimum timeline):
F-01 → F-04 → F-06 → M-01 → M-03 → I-01

PARALLEL TRACK A (testing):
F-02 → F-11 → M-08

PARALLEL TRACK B (CI/CD):
F-08 → F-09 → H-03 → H-04

PARALLEL TRACK C (data layer):
F-03 → F-07 → M-02

NO DEPENDENCIES (start anytime):
F-05, F-10, I-08

```

---

## 6. Coding Standards (Non-Negotiable)

- **TypeScript strict mode.** No `any` types. All function signatures fully typed.
- **D1 queries:** ALWAYS parameterized with `.bind()`. NEVER string interpolation.
- **API responses:** `{ status: 'success' | 'error', data?, code?, message?, correlationId, timestamp }`
- **Health endpoints:** additive-only contract. Never remove existing keys from HealthResponse.
- **Error handling:** try/catch at handler level, structured error response, log with correlation ID.
- **Zod validation** on every API input via `@hono/zod-validator` middleware.
- **No inline styles.** TailwindCSS only for frontend components.
- **All components** must have loading, error, and empty states.
- **Environment config** via wrangler.toml `[env.dev]`, `[env.staging]`, `[env.production]`.
- **Git commits:** conventional commits format (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- **Test files:** co-located as `__tests__/[module].test.ts` or `[module].spec.ts`.
- **Secrets:** never hardcoded. Always via env bindings or 1Password injection.

---

## 7. Risk Register

| Risk | Impact | Mitigation | Owner |
|------|--------|-----------|-------|
| D1 schema migration breaks prod data | 🔴 CRITICAL | Use D1 Time Travel backups. Always run in dev/staging first. Never DROP columns without data migration. | CodeGen + Manual |
| Agent webhook delivery failures cascade | 🟠 HIGH | Circuit breaker per agent. Dead letter queue. Health check before delivery. Alert on DLQ depth. | CodeGen |
| Multi-tenant data leakage via missing tenant_id | 🔴 CRITICAL | Tenant context middleware on every request. Integration tests verify isolation. Code review gate. | CodeGen + Manual |
| 1Password Connect token compromised | 🟠 HIGH | Switch to read-only token. Enable OIDC exchange. Rotate immediately. Monitor access logs. | Manual |
| Cloudflare Workers resource limits hit | 🟡 MEDIUM | Monitor CPU time/memory. Split heavy ops into Queues. Use waitUntil() for non-critical work. | CodeGen |

---

## 8. Success Metrics

### Phase 1 Exit Criteria
- [ ] Core API Worker deployed to dev with /health returning 200
- [ ] D1 schemas applied via `wrangler d1 migrations apply`
- [ ] Auth middleware passing JWT tests (valid, expired, malformed, missing)
- [ ] CI pipeline: lint + type-check + test on every PR
- [ ] Test coverage ≥ 80% statements on shared packages
- [ ] 1 onboarding flow completes end-to-end in dev

### Phase 2 Exit Criteria
- [ ] Event published via Core API reaches registered agent within 5 seconds
- [ ] Workflow state machine completes 3-step onboarding with timeout handling
- [ ] Dead letter queue captures failed deliveries with full error context
- [ ] Agent registry has ≥ 2 registered agents (Slack + CDT)

### Phase 3 Exit Criteria
- [ ] Marketplace UI renders connector catalog from API
- [ ] ≥ 2 connectors installable: Google Workspace + Slack
- [ ] Credentials stored encrypted in KV, retrievable only by owning tenant
- [ ] Feature flags controlling connector availability per tenant
```
