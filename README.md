# AtlasIT

> Reality Snapshot (Sept 2025): The production codebase currently ships **three Cloudflare Workers (onboarding, orchestrator, docs)** plus a shared utility package. The broader UI vision (compliance center, policy engine, risk matrix, marketplace, API manager) **is NOT implemented yet**. This README makes that distinction explicit and outlines the incremental path forward.

AtlasIT is an edge‑native automation substrate. The present deployed scope is intentionally slim: provision onboarding flows, run internal automation tasks, and publish operational documentation. All higher‑level governance & compliance modules remain roadmap items.

## Active Components (Implemented Today)

| Component            | Purpose                                          | Storage                     | Notes                                         |
| -------------------- | ------------------------------------------------ | --------------------------- | --------------------------------------------- |
| Onboarding Worker    | Initial tenant/user process + future IDP tie‑ins | KV / (planned D1)           | Auth via API key (temporary)                  |
| Orchestrator Worker  | Task submission, scheduled cron execution        | KV (tasks)                  | Cron every 5m; to expand into workflow engine |
| Documentation Worker | Mutable operational runbook JSON + health        | KV (`atlasit_docs` primary) | Dual‑read legacy key supported                |
| Shared Library       | Logging, env validation, small utilities         | —                           | Consumed by all workers                       |

Non‑production / legacy artifacts are isolated in `LEGACY.md`.

## Quick Start

### Prerequisites

- Node.js 18+
- npm (workspace-aware)
- Cloudflare Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers access

### Bootstrap Local Env

```bash
# Clone & install workspace dependencies
npm install

# Copy template env and fill required values
cp .env.example .env

# Validate required vars (uses .env + process env)
npm run validate:env
```

### Run Core Workers

```bash
# Start onboarding + orchestrator in parallel
npm run dev:core

# Or start an individual worker
npm run dev:onboarding
```

Refer to `ops/ENDPOINTS.md` for the live route inventory (only the three workers). A future `frontend/` app will surface a dashboard once APIs for compliance/policies exist.

## Testing & Validation

| Command                | Purpose                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `npm run validate:env` | Fails fast if required configuration or secrets are missing.                       |
| `npm run typecheck`    | Strict TypeScript check scoped to active workers and packages.                     |
| `npm run test:unit`    | Executes onboarding, orchestrator, shared, and documentation worker Vitest suites. |
| `npm run predeploy`    | Runs `validate:env`, `typecheck`, and unit tests before deployment.                |

Secret scanning and dependency audits (`npm run scan:secrets`, `npm audit --omit=dev`) complement predeploy checks.

## Deployment

1. **Pre-check**

   ```bash
   npm run predeploy
   ```

2. **Seed Secrets** (repeat per worker as needed)

   ```bash
   # Onboarding
   cd onboarding
   wrangler secret put ONBOARDING_API_KEY
   wrangler secret put ORCHESTRATOR_API_KEY   # if orchestrator key shared

   # Orchestrator
   cd ../ai-orchestrator
   wrangler secret put API_ALLOWED_KEYS
   wrangler secret put AI_GATEWAY_TOKEN

   # Documentation worker (optional today)
   cd ../documentation-worker
   wrangler secret put API_ALLOWED_KEYS
   ```

3. **Deploy Workers**

   ```bash
   cd onboarding && wrangler deploy
   cd ../ai-orchestrator && wrangler deploy
   cd ../documentation-worker && wrangler deploy
   ```

4. **Post-Deploy Smoke Tests**

   ```bash
   curl -H "x-api-key: $ONBOARDING_API_KEY" https://<onboarding-domain>/onboarding/start -d '{"industry":"technology"}'
   curl https://<orchestrator-domain>/health
   curl https://<docs-domain>/docs
   ```

See `ops/DEPLOYMENT_SUCCESS_REPORT.md` for last deployment snapshot and `ops/ALIGNMENT_PLAN.md` for branding & migration tasks.

## Documentation

- `ops/ENDPOINTS.md` – Current API catalog for the three workers (docs worker marked experimental).
- `AtlasIT Development Guide.md` – Architecture & dev practices.
- `LEGACY.md` – Archived Ignite/MCP context retained for provenance.
- `ops/ALIGNMENT_PLAN.md` – Branding + migration phases.
- `docs/RECOMMENDED_UPDATES.md` – Consolidated audit of backend feature gaps, planned endpoints, observability & retention roadmap (keep in sync during compliance build-out).

## Roadmap Phases (Planned – Not Implemented)

| Phase | Title                     | Key Deliverables                                                   | Exit Criteria                           |
| ----- | ------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| 1     | UI & API Stubs            | Frontend scaffold, compliance score stub, policy stub endpoints    | Dashboard loads with stub data          |
| 2     | Compliance Core           | D1 schema (framework status, audits, risks), real score calc cron  | Score persists & updates <15m interval  |
| 3     | Policy Engine             | Template rendering, tenant profile, versioned policy storage       | Generate & retrieve 5 baseline policies |
| 4     | Directory & JML           | Okta sync (users/groups), lifecycle metrics, orchestrator triggers | New user appears in <2 min              |
| 5     | Reporting & Export        | Report generation (PDF/MD), signed export links, audit timeline    | Downloadable compliance report          |
| 6     | Hardening & Observability | Rate limits, metrics, structured logs, security scan gating        | p95 latency <75ms, 0 high vulns         |

Anything beyond Phase 6 (LLM refinement, marketplace, advanced analytics) will be chartered separately once core stability is proven.

### Gap Clarification

If a feature is visible in design mockups (e.g. Risk Assessment Matrix) but absent here, it is _not built_. Track its status through issues mapped to the phases above.

## Legacy Notes

Historic Ignite and MCP automation materials now reside in [`LEGACY.md`](LEGACY.md). They are excluded from sprint planning unless explicitly re-scoped into a roadmap phase.

## Contributing

Please open issues or PRs for bug fixes and improvements. Run `npm run predeploy` before submitting changes.

## License

MIT License. See `LICENSE` if provided by the repository owner.

## UI Console (SvelteKit – Experimental)

An internal compliance & risk prototype now lives under `console-app/` (SvelteKit + Tailwind). It exposes a runtime config endpoint at `/api/config` used by the UI to discover the compliance API base (`complianceBase`). By default this falls back to the local mock implementation at `/api/mock/compliance/snapshot` and a dashboard view at `/console` visualizing framework coverage, a risk matrix, and policy cards.

Run locally:

```bash
npm run dev:console
```

Runtime config validation (optional):

```bash
curl -s http://localhost:5173/api/config | jq
curl -s "http://localhost:5173$(curl -s http://localhost:5173/api/config | jq -r .complianceBase)/snapshot" | jq '.frameworkSummary[0]'
```

To point the UI at a deployed compliance worker set `COMPLIANCE_BASE` (copy `console-app/.env.example` → `.env`):

```bash
COMPLIANCE_BASE=https://your-compliance-worker.example.com/api/compliance
```

The prior temporary React `demo-app/` has been removed after migration to a unified SvelteKit approach.

### New Security Operations Surfaces (In Progress)

An early Access Requests management page (`/access-requests`) has been added (create + approve/deny/fulfill with optimistic UI, pagination & filtering) alongside backend endpoints (`/api/v1/access-requests`). This is a stepping stone toward a broader security & compliance console; expect path/name consolidation once the full compliance center is integrated.
