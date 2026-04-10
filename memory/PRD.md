# AtlasIT AWS Migration — M1.4 + M2.2

**Repository:** JW-Flo/Project-AtlasIT  
**Branch:** codex/onboarding-console-deploy  
**PR:** https://github.com/JW-Flo/Project-AtlasIT/pull/406  
**Date:** 2026-04-10

---

## Problem Statement

Port onboarding Cloudflare Worker routes to Lambda (M1.4) and configure the
SvelteKit console app for a parallel static build targeting AWS S3 + CloudFront (M2.2).

---

## Architecture Overview

- **Backend:** AWS Lambda (Node 20) + API Gateway + RDS PostgreSQL  
- **Frontend:** SvelteKit console app — Cloudflare Pages (primary) + S3/CloudFront (new parallel target)  
- **CI/CD:** GitHub Actions; pnpm workspaces

---

## What Was Implemented (this session) — 2 commits on codex/onboarding-console-deploy

### M1.4 — Onboarding Lambda route parity
- Verified all CF Worker routes (`POST /onboarding/submit`, `POST /api/onboarding`,
  `GET /api/onboarding/*`, `GET /api/onboarding/questions`, `POST /onboarding/start`,
  `GET /health`) are present in `lambdas/onboarding-api/src/routes.ts`
- Extra route `GET /api/onboarding/sessions/:sessionId` added (not in CF Worker)
- All routes use `extractAuth()`, `bootstrap()`, `ok()`/`fail()`, regex path matching,
  parameterized `pg` queries with `WHERE tenant_id = $1` isolation
- `AWS-MIGRATION-STATUS.md` updated: M1.4 marked complete

### M2.2 — Console app static build
- Installed `@sveltejs/adapter-static@^3.0.10` as devDependency in `console-app/`
- `console-app/svelte.config.aws.js` rewritten: `adapter-static` with `fallback: 'index.html'`
- `.github/workflows/deploy-console-s3.yml` rewritten per spec:
  - pnpm@9, builds `packages/shared` first, then console via `SVELTE_CONFIG` env var
  - OIDC role `arn:aws:iam::457335975503:role/atlasit-github-actions-deploy`
  - SSM-driven bucket + CloudFront distribution discovery
  - `aws s3 sync console-app/build/ s3://$BUCKET --delete`
  - `aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"`
- `console-app/vite.config.ts` updated: `SVELTE_CONFIG` env var support
  (copies named config to `svelte.config.js` in CI before sveltekit() reads it)
- `console-app/src/routes/api/_proxy-helpers.ts`: `getWorkerBase()` now respects
  `PUBLIC_API_URL` / `VITE_API_URL` override; empty default keeps CF behaviour

---

## Validation

- `node scripts/build-lambdas.mjs --function onboarding-api` → **OK**
- `cd console-app && pnpm install` → **Done**
- `packages/shared pnpm run build` → **0 errors**
- `packages/shared vitest` → **40/40 pass**
- `ai-orchestrator npm test` → **20/20 pass** (was crashing)
- `onboarding npm test` → **15/15 pass**
- `git push` pre-push hooks → **PASS** (no `--no-verify`)

---

## What Was NOT Changed

- `lambdas/onboarding-api/src/routes.ts` — no edits needed (all routes pre-existing)
- `console-app/svelte.config.js` — CF adapter untouched
- All Terraform files in `infra/aws/`
- All Cloudflare Worker source files

---

## Prioritized Backlog

### P0 — Blocking for AWS traffic
- M2.1: Terraform convergence (Lambda SG drift, Step Functions state machine)
- M3: Data migration (D1→RDS, KV→DynamoDB, R2→S3)
- M4: End-to-end smoke tests on AWS

### P1 — DNS + cutover
- M5: DNS cutover (Route 53 / CloudFront aliases)
- M2.3: CI/CD unification (dual-deploy during transition)

### P2 — Post-migration
- M6: Adapter migration + CF decommission
- M7: 2-week stability window + QA

---

## Next Tasks

1. Merge PR #406 after review
2. Run `terraform apply` to resolve remaining state drift (M2.1)
3. Connect console API proxy routes to API Gateway (`PUBLIC_API_URL` / `VITE_API_URL`)
4. Execute data migration scripts (M3)
5. Run `scripts/smoke-test-aws.sh dev` (M4.1)
