# AtlasIT

Cloudflare Workers based automation substrate for onboarding, orchestration, docs, and future compliance modules.

## Cloudflare Binding Configuration (Diagnostics Reference)

If you encounter responses indicating missing bindings (e.g. `DISPATCHER_BINDING_MISSING` or console warnings `[bindings] Missing Cloudflare bindings detected`), ensure the following are present in `wrangler.toml` for the target environment (e.g. `[env.core]`, `[env.production]`, or `[env.ai]`).

### Required (current code references)

- KV: `KV_SESSIONS`, `KV_CACHE`, `KV_FEATURE_FLAGS`, `MCP_STORE`
- D1: `ATLAS_CORE_DB`, `ATLAS_AUDIT_DB`, `ATLAS_COMPLIANCE_DB`, `ATLAS_AUDIT_SHADOW`
- R2: `atlas_policies`, `atlas_evidence`, `atlas_artifacts`
- Optional Dispatch Namespace: `dispatcher` (only if using sub-worker routing segments)

### Example snippet for a new environment

```toml
[env.core]
name = "atlasit-core"
main = "index.js"
compatibility_date = "2025-05-16"
workers_dev = true

[[env.core.kv_namespaces]]
binding = "KV_SESSIONS"
id = "<kv id>"
[[env.core.kv_namespaces]]
binding = "KV_CACHE"
id = "<kv id>"
[[env.core.kv_namespaces]]
binding = "KV_FEATURE_FLAGS"
id = "<kv id>"
[[env.core.kv_namespaces]]
binding = "MCP_STORE"
id = "<kv id>"

[[env.core.d1_databases]]
binding = "ATLAS_CORE_DB"
database_name = "atlas_core_db"
database_id = "<uuid>"
[[env.core.d1_databases]]
binding = "ATLAS_AUDIT_DB"
database_name = "atlas_audit_db"
database_id = "<uuid>"

[[env.core.r2_buckets]]
binding = "atlas_policies"
bucket_name = "atlas-policies"
[[env.core.r2_buckets]]
binding = "atlas_evidence"
bucket_name = "atlas-evidence"
[[env.core.r2_buckets]]
binding = "atlas_artifacts"
bucket_name = "atlas-artifacts"

# Optional (requires eligible plan)
# [[env.core.dispatch_namespaces]]
# binding = "dispatcher"
# namespace = "atlasit-dispatcher-namespace"
```

### Local Secret Setup

Secrets such as `SLACK_WEBHOOK_URL` or `AI_GATEWAY_TOKEN` must be set via Wrangler:

```bash
wrangler secret put SLACK_WEBHOOK_URL --env core
wrangler secret put AI_GATEWAY_TOKEN --env ai
```

### Troubleshooting Steps

1. Run `wrangler whoami` to confirm account.
2. Run `wrangler deploy --env core` (or relevant env) and inspect output for binding mismatches.
3. Use `wrangler kv namespace list`, `wrangler d1 list`, and `wrangler r2 bucket list` to verify resource existence.
4. If dispatch errors occur and you do not need dispatch, remove the routing logic referencing `env.dispatcher` in `index.js`.

### Runtime Diagnostics

At startup, the worker emits a one-time console warning listing any missing expected bindings. This does not break the request lifecycle but should be addressed before production promotion.

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

## JW-Site Integration (Marketing / Public Site)

The public site ("JW-Site") will be pulled into this monorepo via **git subtree** at `packages/jw-site`.

### Status

- Placeholder directory exists: `packages/jw-site/`.
- Live code still in external repo `JW-Flo/JW-Site` until subtree import executed.

### Import (Full History)

```bash
npm run sync:jw-site:add
```

Subsequent updates:

```bash
npm run sync:jw-site:pull
```

### Rationale (subtree vs submodule)

- Single commit graph; simpler CI.
- Easier developer onboarding (no submodule init step).
- History retained (auditing, blame continuity).

### Normalization Checklist After Import

1. Ensure `package.json` name `@atlasit/jw-site` (private) & remove redundant dependencies.
2. Add build script: `build:jw-site` (and deploy if needed) to root.
3. Extract duplicate auth/session code into future `packages/auth` module.
4. Add Playwright project for public site pages.
5. Provide `.env.example` for site-specific runtime config.
6. Align JWT/session secrets with console for shared auth surface if/when needed.

### Rollback

```bash
git rm -r packages/jw-site && git commit -m "chore: remove jw-site subtree"
```

### Security

List unique site secrets in `packages/jw-site/SECURITY.md`; link back to root security guidance. Do not duplicate full content.

---

This section will update once the subtree import completes.

### Codex Container Workflow

- Build the runtime image with `docker build -f docker/Dockerfile.codex -t codex:latest .`.
- Run the container guard with `docker run --rm -v "$(pwd)":/workspace -w /workspace codex:latest bash docker/codex-exec.sh /workspace [PR_ID] [AGENT_ID]`.
- `docker/codex-exec.sh` surfaces protected globs from `codex-work.json` and exits if a task (or you) modify guarded areas.
- Dynamic scanner toggles: set `ENABLED_SCAN_TYPES` to a comma list (e.g. `full,threat-intel`) or use `DISABLED_SCAN_TYPES` to block specific scanners; unset values keep current defaults.
- Keep contributions outside guarded policy/automation/auth paths unless an owner updates `codex-work.json` alongside the change.

#### Codex Prompt Size Optimization

To prevent model context overflows during dynamic runtime hardening:

1. Generate trimmed context bundle:
   ```bash
   npx ts-node tools/generate-codex-context.ts
   ```
   Outputs `codex-context.trimmed.txt` (concise summaries).
2. Provide only that file plus the specific source being changed (e.g. `src/runtime/scans/service.ts`, `src/runtime/scans/metrics.ts`). Avoid pasting entire README.
3. Update `docs/codex/minimal-runtime-context.md` when structural concepts change; do not expand prompts with large multi-file excerpts.
4. Break large enhancements into phases:
   - Phase A: capability gating + timeout layer
   - Phase B: telemetry ring buffer + metrics accessors
   - Phase C: admin reload + diagnostics + health append
5. Target <25k characters per prompt. The generation script truncates long sections automatically.
6. Prefer references ("see ring buffer shape in minimal-runtime-context.md") over re-embedding identical JSON examples.

Key env vars (hardening scope): `ENABLED_SCAN_TYPES`, `DISABLED_SCAN_TYPES`, future: `ENABLE_CAPABILITIES`, `DISABLE_CAPABILITIES`, `SCAN_TIMEOUT_MS`.

This workflow cuts token usage, speeds iteration, and reduces stream disconnect errors.

Helper scripts:

```bash
# Standard trimmed bundle
npm run codex:context
# Ultra (no README, core + sheet only)
npm run codex:context:ultra
# Select sections (comma list substrings of titles)
npm run codex:context:sections -- --sections=prompt,protection
```

Refer to `docs/codex/prompt-update-sheet.md` and specify only needed section numbers in Codex prompts (e.g. "Use sections 1,5,7").

### Dynamic Runtime (Phase 1)

- Feature registry scaffolding lives in `src/runtime/registry`, enabling immutable snapshots without touching existing handlers yet.
- Dynamic config loader (`src/runtime/config/dynamicConfig`) merges KV, environment, and defaults with TTL-based caching for opt-in consumers.
- Utilities (`src/runtime/util/hash`, `src/runtime/log`) support consistent hashing and logging during future integrations.
- No user-facing behaviour changes in Phase 1; follow-up phases will adopt the registry/config layers incrementally.
- Phase 2 adds runtime-managed scan modules (`src/runtime/scans`) and exposes `/api/_routes` for introspection while keeping the existing scanner endpoint compatible.

#### BaseFeature & Capability Tags (Phase A)

- Use `registerFeature` (`src/runtime/features/registry.ts`) to declare any runtime capability (scan, job, data, etc.); scans must supply an async `run` handler.
- Capabilities (`provides`, `requires`) are stored alongside metadata for future gating and surface in health telemetry under `dynamicRegistry.features`.
- Snapshot access via `getFeatures(kind)` keeps the original immutable semantics while adding `features.version` / `features.countsByKind` to health responses.
- Capability gating precedence: (1) `ENABLED_SCAN_TYPES`, (2) `ENABLE_CAPABILITIES`, (3) `DISABLED_SCAN_TYPES`, (4) `DISABLE_CAPABILITIES`.
- Timeout and diagnostics controls: `SCAN_MODULE_TIMEOUT_DEFAULT` plus per-module overrides (`SCAN_MODULE_TIMEOUT_<UPPER_ID>`), synthetic findings (`MODULE_TIMEOUT`, `MODULE_FAILED`) appended to results, and runtime metrics accessible via `getScanTimings()` or `/api/_diagnostics`.
- Observability endpoints: `/api/_diagnostics` returns rolling timing stats (p50/p95/avg/timeout counts); `/api/admin/reload` rebuilds registry snapshots with 2s debounce and returns `{ ok, version, counts, enabledScanIds }`.
- Health payloads now append `scanPerf` (total p95 + per-module lastMs) while preserving existing fields.
- Example diagnostics payload:
  ```json
  {
    "diagnostics": {
      "scanTimings": {
        "total": {
          "count": 8,
          "p95": 72.5,
          "p50": 41.2,
          "avg": 39.6,
          "lastMs": 36.1
        },
        "modules": {
          "headers": {
            "count": 8,
            "p95": 22.8,
            "p50": 12.2,
            "avg": 13.0,
            "lastMs": 11.4,
            "timeoutCount": 0
          }
        }
      }
    }
  }
  ```

### Dynamic Runtime (Phase 2 – In Progress)

_Status: foundational modules merged; incremental adoption underway._

New capabilities introduced in Phase 2 build upon the Phase 1 registry & config layers without breaking existing consumers:

#### 1. Scan Module Runtime

- Location: `src/runtime/scans/service.ts` (+ individual modules under `src/runtime/scans/modules/*`).
- Each scan module (e.g. `headers.ts`, `ssl.ts`, `info.ts`, `threatIntel.ts`, `cve.ts`) self‑registers on import.
- Helper exports: `getAvailableScanTypes(config?)`, `runScan(id, url, ctx, config?)`, `runFullScan(url, ctx, config?)`, `resolveEnabledScanIds(config, { includeFull })`.
- Dynamic enable / disable precedence:
  1.  `ENABLED_SCAN_TYPES` (comma list) – explicit allowlist.
  2.  `DISABLED_SCAN_TYPES` (comma list) – exclusion list if no allowlist.
  3.  Defaults (all core modules) if neither provided.
- Full scan aggregates per‑module findings, tagging duration + per module `findings` count.

#### 2. Route Registry

- Utility: `src/runtime/routes/registerRoute.ts` lets API handlers self‑register (method, path, description).
- Introspection endpoint `/api/_routes` (mirrored in JW-Site immersive app) returns a snapshot for tooling / observability.

#### 3. Enhanced Security Scan Endpoint Refactor

- Both `apps/jw-immersive/src/pages/api/enhanced-security-scan.ts` and (public site) `JW-Site/src/pages/api/enhanced-security-scan.ts` now delegate to scan runtime.
- Returns `NO_ACTIVE_SCANS` (HTTP 200, structured payload) if configuration gates all scanners off.
- Emits per‑module completion logs (`[runtime:scan.module.completed]`) + aggregate log (`scan.full.completed`).

#### 4. Health Endpoint Augmentation

- Health responses now append (never overwrite existing keys):

      ```jsonc

  {
  // ...existing fields,
  "dynamicRegistry": {
  "version": <number>,
  "counts": { "scanModules": <n>, "routes": <n>, ... },
  "lastBuildTs": <unix_ms>
  }
  }
  ```

- Purpose: fast visibility into dynamic snapshot churn & module cardinality; safe for append‑only consumers.

#### 5. Session Lifecycle Enhancements (package: `packages/auth`)

- New methods: `isActive(session)`, `revoke(sessionId)`, `rotateRefreshToken(sessionId)`.
- `revoke` sets `revoked_at` and invalidates cache; `rotateRefreshToken` generates cryptographically strong new token + hashed storage; both purge KV cache entry.
- Tests: `packages/auth/test/session-extended.test.ts`.

#### 6. Guestbook Dynamic Mode Flag

- Flag resolution precedence:
  1.  `GUESTBOOK_DYNAMIC_MODE` env var (`true|false`).
  2.  Dynamic config key `guestbook.dynamic.enabled` (boolean or string) if runtime config present.
  3.  Legacy non‑production heuristic fallback (`GUESTBOOK_PRODUCTION !== 'true'`).
- When enabled in a non‑production context a deterministic test entry (id `999999`) is appended for automated validation; disabling the flag restores purely DB‑backed responses.
- Implementation is lazy-import + try/catch guarded; absence of the dynamic layer = graceful fallback. - Code: `JW-Site/src/pages/api/guestbook.ts`. - Tests: `JW-Site/src/test/guestbook.dynamic-mode.test.ts`.

#### 7. Logging Additions

- Registry build emits `[runtime:registry.snapshot] { version, countsHash }` once per snapshot rebuild.
- Scan modules emit structured logs enabling lightweight performance + coverage telemetry without extra storage round‑trips.

#### 8. Example Usage

```ts
import { getConfig } from "src/runtime/config/dynamicConfig";
import { getAvailableScanTypes, runScan } from "src/runtime/scans/service";

const config = await getConfig();
const types = await getAvailableScanTypes(config);
if (types.includes("headers")) {
  const result = await runScan("headers", "https://example.com", {
    env: process.env,
  });
  console.log(result.summary.securityScore);
}
```

#### 9. Contract & Schema Safeguards

- Append‑only approach enforced by health tests (e.g. `health-schema-append-only.test.ts`).
- Dynamic registry presence is optional for older deployments; absence means `dynamicRegistry` key simply omitted.

**10. Next (Phase 3 Preview)**

- Expand registry to encompass policy adapters & compliance snapshot builders.
- Introduce lightweight TTL cache table for expensive multi‑module aggregates (`api_cache` pattern).
- Expose enriched health sub‑section for scan performance stats (p50/p95) once storage cost model finalized.

### Environment & Config Reference (Addendum)

| Variable / Key                    | Type    | Purpose                                             | Notes                        |
| --------------------------------- | ------- | --------------------------------------------------- | ---------------------------- | ------------------------- |
| `ENABLED_SCAN_TYPES`              | env     | Comma allowlist of scan ids                         | Overrides disabled list      |
| `DISABLED_SCAN_TYPES`             | env     | Comma denylist of scan ids                          | Ignored if allowlist present |
| `GUESTBOOK_DYNAMIC_MODE`          | env     | Force enable / disable dynamic guestbook test entry | `true                        | false` (case-insensitive) |
| `guestbook.dynamic.enabled`       | dyn cfg | Same as above via dynamic config layer              | Lower precedence than env    |
| `guestbook.dynamic.enabled` (cfg) | KV/env  | Accessed through `getConfig()` TTL cache            | TTL per dynamicConfig loader |

---

For deep architectural rationale see `docs/ADR-Dynamic-Architecture.md` (Phase 2/3 updates appended) and associated integration tests:

- Scan runtime integration: `tests/runtime/scans.integration.test.ts`
- Routes enumeration: `tests/api/routesMap.test.ts`
- Session lifecycle: `packages/auth/test/session-extended.test.ts`
- Guestbook dynamic flag: `JW-Site/src/test/guestbook.dynamic-mode.test.ts`

If introducing additional dynamic flags, follow the precedence + lazy import safety pattern demonstrated above and extend health metadata in an append-only manner.

### Dynamic Runtime (Phase B – Jobs & Data Providers)

Status: Implemented (foundational). This phase introduces lightweight background job execution and on-demand data providers leveraging the existing feature registry. It deliberately avoids capability gating / telemetry internals currently owned by Codex (see active Codex task list) to prevent overlap.

#### 1. Job Scheduler

- Module: `src/runtime/jobs/scheduler.ts`
- Behavior: Enumerates registered `job` features once on `startScheduler()`. Each job exposes `schedule.intervalMs` and an async `run()`.
- Design Goals: Minimal overhead, no burst on cold start (first execution delayed until first interval), structured error logging (`job.run.error`).
- Stats Tracked (in-memory, ephemeral): runs, errors, lastError, lastRunAt, avgMs, totalMs. Snapshot accessor: `schedulerSnapshot()`.
- Metrics Snapshot Job: `metrics-snapshot` (every 30s) captures registry + scheduler snapshot into memory (`getLastMetricsSnapshot()`). Intended for future health/diagnostic surfacing without expensive recomputation.

#### 2. Data Providers

- Abstraction: `data` kind features with an async `fetch(params, ctx)` method.
- Utilities: `src/runtime/data/providers.ts` exports `fetchProvider(id, opts)` and `listProviders()`.
- Example Provider: `site-metadata` returns registry version, counts, and sourceHash (fast, no external IO).

#### 3. Health & Append-Only Principles

- Phase B does not mutate existing health response keys; new scheduled + provider introspection will append under a future `dynamicRegistry.jobs` / `dynamicRegistry.dataProviders` section when Codex telemetry gating lands. Current tests (`tests/runtime/health-augmentation.test.ts`) ensure registration does not regress snapshot integrity.

#### 4. Testing

- Scheduler basic execution: `tests/runtime/scheduler.test.ts` (interval registration & run occurrence).
- Data providers: `tests/runtime/dataProviders.test.ts` (list + fetch contract).
- Health augmentation scaffold: `tests/runtime/health-augmentation.test.ts` (ensures job/data features present).

#### 5. Extension Guidelines

When adding additional jobs or providers:

1. Register via `registerFeature({ kind: 'job' | 'data', ... })` early in module scope.
2. Keep intervals >= 30s unless a demonstrable low-cost need exists.
3. Avoid persistent state writes inside jobs; prefer in-memory then expose via cached endpoints.
4. Any new health fields must be appended only—never remove or rename existing keys.

#### 6. Future Integration Points (Deferred to Codex Phase)

- Capability gating (`ENABLE_*` / `DISABLE_*` for jobs & providers) will layer atop `provides`/`requires` arrays already stored.
- Telemetry ring buffer will replace ad-hoc avgMs once standardized metrics emitters are added.
- Admin reload endpoint can trigger a scheduler restart cycle to pick up newly registered jobs (present design keeps a single initialization pathway).
