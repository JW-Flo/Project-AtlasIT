# AtlasIT CI/CD Pipeline

**Last updated:** April 2026

## Overview

All production deploys flow through a single workflow: `.github/workflows/deploy-on-merge.yml`. It triggers on push to `main` and via `workflow_dispatch`.

## Pipeline Architecture

```
Push to main
  ↓ dorny/paths-filter (detect changed paths)
  ↓ Conditional deploy jobs (only affected workers)
  ↓ pnpm install + build (per worker)
  ↓ wrangler deploy
  ↓ scripts/smoke-test.sh <worker> <url>
```

## Workers Covered

| Worker                  | Path Filter                        | Build Notes                                |
| ----------------------- | ---------------------------------- | ------------------------------------------ |
| console-app             | `console-app/**`, `packages/**`    | SvelteKit → CF Pages                       |
| core-api                | `core-api/**`, `packages/**`       | Standalone install (not in workspaces)      |
| ai-orchestrator         | `ai-orchestrator/**`, `packages/**`| Workspace member                           |
| compliance-worker       | `compliance-worker/**`, `packages/**`, `shared/**` | Workspace member              |
| onboarding              | `onboarding/**`, `packages/**`     | Workspace member                           |
| dispatch-worker         | `dispatch-worker/**`, `packages/**`| Standalone install                         |
| documentation-worker    | `documentation-worker/**`          | Pre-built (`main = "index.js"`)            |
| email-worker            | `email-worker/**`                  | TypeScript build                           |
| apex-redirect-worker    | `apex-redirect-worker/**`          | TypeScript build                           |
| scheduler-worker        | `scheduler-worker/**`              | TypeScript build                           |
| marketplace             | `marketplace/**`, `packages/**`    | Standalone install                         |
| slack-approval-worker   | `slack-approval-worker/**`         | Pre-built JS                               |

## Security Scanning

Two checks run on every PR:
- **GitGuardian** — secret detection in diffs
- **Gitleaks** — broad secret scanning (GH Actions)

Weekly scheduled scans:
- **Snyk** — dependency vulnerability scanning
- **ZAP** — DAST security scanning

## Smoke Tests

Post-deploy smoke tests use `scripts/smoke-test.sh <worker-name> <base-url>`:
- Validates `/health` or root endpoint returns 200
- Workers behind CF Access use `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` env vars
- Supports: console-app, core-api, ai-orchestrator, compliance-worker, onboarding, documentation-worker, apex-redirect-worker, email-worker

## Key Conventions

- **Shared package build**: Always `rm -rf dist tsconfig.tsbuildinfo && npx tsc -p tsconfig.json` in `packages/shared` before deploying — stale `.tsbuildinfo` can cause empty `dist/`
- **Workspace vs standalone**: Workers in `package.json` `workspaces` share root `node_modules`. Standalone workers (`core-api`, `dispatch-worker`, `marketplace`) need their own `pnpm install --no-frozen-lockfile`
- **Wrangler named envs**: `[env.<name>]` sections do NOT inherit top-level bindings — each must declare all bindings explicitly
- **Debug deploys**: Use `WRANGLER_LOG=debug` env var (not `--log-level` flag)
- **Dry run validation**: `npx wrangler deploy --dry-run --config <path>` before pushing CI changes

## Pre-Push Checklist

1. Verify CLI flags exist (`npx wrangler deploy --help`)
2. Validate shell scripts (`bash -n scripts/<name>.sh`)
3. Test locally with `--dry-run`
4. Ensure path filters in deploy-on-merge.yml cover all modified directories
