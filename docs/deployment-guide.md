# AtlasIT Deployment Guide

**Last updated:** April 2026

## Overview

AtlasIT runs entirely on Cloudflare: Workers for compute, D1 for storage, KV for caching/sessions, R2 for evidence artifacts, Queues for async dispatch. The console app runs on CF Pages (SvelteKit).

## Architecture

```
                    ┌──────────────────┐
                    │   CF Pages       │
                    │  (console-app)   │
                    │   SvelteKit      │
                    └────────┬─────────┘
                             │ fetch()
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │  core-api   │   │ compliance  │   │ orchestrator│
   │   (Hono)    │   │   worker    │   │  (cron+DO)  │
   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
          │                  │                  │
   ┌──────▼──────────────────▼──────────────────▼──────┐
   │              D1 · KV · R2 · Queues                │
   └───────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable`)
- Wrangler CLI (`pnpm add -g wrangler`)
- Authenticated: `wrangler login && wrangler whoami`

## Automated Deploys (Primary)

All production deploys run via `.github/workflows/deploy-on-merge.yml` on push to `main`. See `docs/ci-plan.md` for full pipeline details.

The workflow:
1. Detects changed paths per worker using `dorny/paths-filter`
2. Runs conditional deploy jobs only for affected workers
3. Executes smoke tests against production endpoints

Manual trigger available via `workflow_dispatch` in GitHub Actions UI.

## Manual Deploy (Single Worker)

```bash
# Example: deploy compliance-worker
cd compliance-worker
pnpm install
npx wrangler deploy --config wrangler.toml

# Smoke test
bash scripts/smoke-test.sh compliance-worker https://compliance.atlasit.pro
```

### Worker-Specific Notes

| Worker | Install | Build | Notes |
| --- | --- | --- | --- |
| console-app | `pnpm install` (workspace) | SvelteKit build via CF Pages | Deployed as Pages project, not Worker |
| core-api | `pnpm install --no-frozen-lockfile` | — | Standalone (not in workspaces) |
| dispatch-worker | `pnpm install --no-frozen-lockfile` | — | Standalone |
| marketplace | `pnpm install --no-frozen-lockfile` | — | Standalone |
| documentation-worker | — | Pre-built (`main = "index.js"`) | No TypeScript build step |
| slack-approval-worker | — | Pre-built JS | No TypeScript build step |
| All others | `pnpm install` (workspace) | TypeScript | Standard workspace members |

### Shared Package Rebuild

If `packages/shared` types changed, rebuild before deploying consumers:

```bash
cd packages/shared
rm -rf dist tsconfig.tsbuildinfo
npx tsc -p tsconfig.json
```

## Database Migrations

```bash
# Apply all pending migrations
npx wrangler d1 migrations apply ATLAS_SHARED_DB

# Check migration status
npx wrangler d1 migrations list ATLAS_SHARED_DB
```

Migrations live in `migrations/` (numbered SQL files, currently 35+).

**Important**: If new migrations add schema changes, all workers consuming those tables must be redeployed together.

## Secrets Management

Secrets are stored in 1Password (vault: AWW_SHARED) and deployed via Wrangler:

```bash
# Set a secret for a worker
npx wrangler secret put API_KEY --config core-api/wrangler.toml

# List secrets
npx wrangler secret list --config core-api/wrangler.toml
```

**Never commit secrets to repo files.**

## Storage Bindings

| Type | Binding | Purpose |
| --- | --- | --- |
| D1 | `ATLAS_SHARED_DB` | All application data |
| KV | `KV_SESSIONS` | Session storage |
| KV | `KV_CACHE` | Compliance scores, API response cache |
| KV | `KV_FEATURE_FLAGS` | Feature flags (rollout %, tenant overrides) |
| KV | `MCP_STORE` | MCP agent state |
| R2 | `atlasit-evidence` | Policies, evidence, artifacts |
| Queues | `atlasit-step-tasks` | Workflow step dispatch |

## Cross-Worker Deploy Considerations

When deploying fewer than all workers:

1. **API contracts** — Console API routes that proxy to other workers must still get valid responses
2. **Shared types** — If `packages/shared` changed, all consumers must redeploy together
3. **D1 migrations** — Apply before deploying workers that depend on new schema
4. **Cron dependencies** — Orchestrator cron referencing new endpoints requires those workers to deploy first

## Troubleshooting

```bash
# Debug deploy (verbose logging)
WRANGLER_LOG=debug npx wrangler deploy --config <path>

# Dry run (validates config without deploying)
npx wrangler deploy --dry-run --config <path>

# Tail logs in real-time
npx wrangler tail <worker-name>

# Test D1 connectivity
npx wrangler d1 execute ATLAS_SHARED_DB --command "SELECT 1"
```

## Live Endpoints

| Service | URL |
| --- | --- |
| Console | https://www.atlasit.pro |
| Docs | https://docs.atlasit.pro |
| Support | https://www.atlasit.pro/support |
| Status | https://status.atlasit.pro |
