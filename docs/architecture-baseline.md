# AtlasIT Architecture Baseline (Phase 0)

## Goals

Establish minimal but extensible foundation enabling AI-guided onboarding, orchestration, and future compliance features while keeping development and PoC costs at $0 (Cloudflare free tier + open-source tooling).

## Guiding Principles

- **Serverless-first**: Cloudflare Workers, KV, D1 (free tier) for low operational overhead.
- **Event + Workflow Oriented**: Standardized workflow actions enabling hire/terminate lifecycle.
- **Least-Cost AI**: Use Cloudflare Workers AI (free allowance) first; abstract provider for fallback to OpenAI/Together.
- **Security & Compliance by Design**: Central audit log pipeline early (KV now, migrate to D1 / R2 later).
- **Monorepo Modularity**: Shared TypeScript utilities package consumed by workers and dashboard.
- **Testability**: Vitest + lightweight integration tests hitting local Wrangler.

## High-Level Components

| Domain        | Component               | Purpose                                       | Initial Implementation                                  |
| ------------- | ----------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Onboarding    | Onboarding Worker       | AI-guided tenant bootstrap                    | `onboarding/` worker (exists)                           |
| Orchestration | Orchestrator Worker     | Manage workflows, dispatch actions, AI assist | `ai-orchestrator/` (exists) -> refactor to shared utils |
| Auth/ID       | IDP Worker              | JWT issuance, SSO hooks (future)              | `mcp-idp/` placeholder                                  |
| Documentation | Documentation Worker    | Auto-generated docs, agent output             | `documentation-worker/`                                 |
| Core API      | Root Worker (Gateway)   | Health, routing, dispatcher usage             | root `index.js`                                         |
| Shared        | Shared Utils Pkg        | Logging, config, env schema, error types      | `packages/shared` (to add)                              |
| Data          | KV Namespaces           | Fast key-value storage                        | Multiple existing bindings                              |
| Data          | D1 Database             | Tenant config, audit log (phase 2+ for logs)  | Existing onboarding D1 binds                            |
| Data          | Durable Objects         | Workflow state mgmt (phase 2)                 | Placeholder only                                        |
| AI            | AI Provider Abstraction | Prompt routing / provider switching           | To add in shared package                                |
| Compliance    | Report Generator        | Summaries + export                            | Future (Phase 3)                                        |

## Data Model (Early)

Tables (D1):

- `tenants(id TEXT PRIMARY KEY, name TEXT, industry TEXT, config JSON, created_at TEXT)` (exists via onboarding logic)
- (Phase 2) `workflows(id TEXT, type TEXT, definition JSON)`
- (Phase 2) `audit_events(id TEXT, ts TEXT, tenant_id TEXT, actor TEXT, action TEXT, target TEXT, status TEXT, meta JSON)`

KV Keys (prefix naming):

- `onboarding:{tenantId}` → onboarding state JSON
- `workflow:run:{runId}` → ephemeral run status (later Durable Objects)
- `audit:daily:{date}:{tenantId}` → aggregated counts (roll-up)

## API Surface (Phase 0 / Hello World)

- `GET /health` (root) – root worker health
- `GET /onboarding/health` – onboarding worker health
- `GET /orchestrator/health` – orchestrator worker health

## Phase 1 Additional

- `POST /onboarding/start` → create onboarding session, return dynamic Q&A (maps existing `/api/onboarding` but refine contract)
- `POST /onboarding/submit` → finalize baseline config

## Orchestration Workflow Model (Preview)

```json
{
  "id": "hire_user",
  "steps": [
    {
      "id": "create_account_gws",
      "integration": "google_workspace",
      "action": "users.insert"
    },
    {
      "id": "assign_license_slack",
      "integration": "slack",
      "action": "scim.user.create"
    },
    { "id": "provision_zoom", "integration": "zoom", "action": "user.create" }
  ],
  "retry": { "max": 3, "backoff": "exponential" }
}
```

## Shared Utilities (packages/shared)

- `logger.ts` – minimal wrapper (conditional pretty vs prod JSON)
- `env.ts` – runtime validation (Zod) of required vars per worker type
- `errors.ts` – domain error classes (extends existing onboarding types)
- `ai.ts` – provider abstraction (cloudflare / together / openai) with interface: `generate(messages, opts)`
- `http.ts` – CORS, JSON helpers

## Local Dev Flow

```
npm install
npx wrangler dev --config onboarding/wrangler.toml
```

Parallel workers can run with separate terminals; add combined script if needed.

## Free Tier Considerations

| Service            | Free Allowance              | Usage Pattern                           |
| ------------------ | --------------------------- | --------------------------------------- |
| Cloudflare Workers | 100k req/day                | Adequate for dev/PoC                    |
| D1                 | Limited beta (dev)          | Small config tables only                |
| KV                 | Reads/Writes allowance      | Lightweight config / state              |
| Workers AI         | Model-dependent free tokens | Short classification + template prompts |
| Stripe             | No platform fee dev         | Billing Phase 4                         |

## Risks & Mitigations

| Risk                                | Impact             | Mitigation                                                  |
| ----------------------------------- | ------------------ | ----------------------------------------------------------- |
| AI cost spike (switching providers) | Unexpected spend   | Default to Cloudflare AI; enforce token ceilings in `ai.ts` |
| State explosion in KV               | Performance / cost | Migrate high-volume logs to D1/R2 Phase 2                   |
| Lack of type sharing causing drift  | Bugs               | Central shared package consumed via path refs               |
| Secrets leakage in repo             | Compliance         | Enforce no `.env` commit; docs + CI grep fail               |

## Next Actions

1. Scaffold `packages/shared` with initial modules.
2. Add Vitest config and sample tests.
3. Add GitHub Action workflow for lint + test.
4. Terraform scaffold for KV + D1 (variables only, manual IDs for now).

---

Document version: 0.1.0
