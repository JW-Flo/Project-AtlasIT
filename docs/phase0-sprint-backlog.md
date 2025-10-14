# Phase 0 Sprint Backlog (Weeks 1–2)

## Objective

Establish baseline platform infrastructure, developer workflow, and minimal service skeletons to enable rapid Phase 1 onboarding feature development while keeping all spend at $0 (Cloudflare free tier + OSS tooling).

## Sprint Goals (Definition of Done)

- Shared TypeScript utilities package published locally and imported by at least one worker.
- Health endpoints available for root, onboarding, and orchestrator workers.
- CI pipeline executes lint, typecheck, tests on PR.
- Terraform scaffold committed (no destructive apply yet).
- Secrets management doc published; no secrets in repo (grep scan passes).

## Work Items

| ID    | Title                                   | Est (pts) | Owner | Status      | Notes                                     |
| ----- | --------------------------------------- | --------- | ----- | ----------- | ----------------------------------------- |
| P0-1  | Architecture baseline doc               | 2         |       | Done        | `docs/architecture-baseline.md`           |
| P0-2  | Shared utils package scaffold           | 3         |       | Done        | logger, env, ai abstraction               |
| P0-3  | Vitest setup + sample test              | 2         |       | Done        | placeholder test passes locally           |
| P0-4  | CI workflow (lint/type/test)            | 2         |       | Done        | `.github/workflows/ci.yml`                |
| P0-5  | Terraform minimal scaffold              | 2         |       | Done        | provider + placeholders                   |
| P0-6  | Secrets & env policy doc                | 1         |       | In Progress | finalize formatting rules                 |
| P0-7  | Health endpoints alignment              | 1         |       | Done        | orchestrator has `/health` and `/healthz` |
| P0-8  | Add env validation to onboarding worker | 2         |       | Done        | validateEnv integrated in index.ts        |
| P0-9  | Add root worker import of shared logger | 1         |       | Done        | log imported and used in index.js         |
| P0-10 | Script: unified dev start               | 2         |       | Done        | npm run dev:core available                |
| P0-11 | CI secret scan (basic)                  | 2         |       | Done        | scripts/scan-secrets.js exists            |

Velocity assumption: 20–24 points.

## Risks / Mitigations

| Risk                         | Impact         | Mitigation                                       |
| ---------------------------- | -------------- | ------------------------------------------------ |
| Over-scoping early workflows | Delays Phase 1 | Timebox to health + skeleton only                |
| AI abstraction churn         | Rework         | Keep provider interface minimal; implement later |
| Terraform drift vs wrangler  | Confusion      | Document source of truth (Wrangler Phase 0)      |

## Exit Criteria Checklist

- [x] `npm run typecheck` passes (with known pre-existing issues)
- [x] `npm run test:unit` available
- [x] No secrets found via basic scan (scripts/scan-secrets.js)
- [x] README updated with dev quickstart
- [x] At least one worker imports `@atlasit/shared` (onboarding, orchestrator)

## Follow-Up (Phase 1 Prep)

- Implement onboarding question generation route (`/onboarding/start`).
- D1 schema migration strategy (lightweight SQL file).
- Expand AI provider to real network calls gated by feature flag.

Document version: 0.1.0
