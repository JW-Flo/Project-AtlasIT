# Next Session: Post-Demo Strategic Work

## What's Done

All demo readiness phases complete and merged:

| Phase                  | PR   | Summary                                                                                              |
| ---------------------- | ---- | ---------------------------------------------------------------------------------------------------- |
| 1 — Bug Fixes          | #477 | compliance-api prefix, settings pathMap, directory sync, policy content                              |
| 2 — Endpoint Audit     | #478 | 41+ endpoints, MFA cast, JML columns, NHI handler, pathMap gaps                                      |
| 3 — Data Seeding       | #479 | Row count audit, compliance packs, evidence, automation rules, policies                              |
| 4 — UI Shapes          | #480 | API response shape fixes for UI components                                                           |
| 5 — UI/UX Polish       | #482 | Dark mode root cause fix (Tailwind `.dark` class), 18 pages + 11 components semantic color migration |
| 6 — Perf & Reliability | #482 | Lambda cold <3s, warm <500ms. CORS, error handling, events pipeline validated                        |
| 7 — Demo Script        | #482 | DEMO-SCRIPT.md — 11-screen click-path with talking points and known limitations                      |

Console deployed to S3/CloudFront at https://www.atlasit.pro

## What's Next (pick based on priority)

### 1. Stripe Live Billing

Wire up real Stripe integration (currently 501 stub).

- Create Stripe products + prices for Free/Starter/Pro/Enterprise tiers
- Set env vars on Lambda (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- Implement checkout session creation + webhook handler in `core-api`
- Test E2E: signup → checkout → webhook → tier upgrade → feature gate enforcement

### 2. NHI Inventory Dashboard

Non-human identity discovery and risk scoring.

- Add `identity_type` column to directory tables (enum: human, service_account, api_key, bot)
- Implement NHI risk scoring algorithm in compliance-api
- Build dashboard page at `/console/nhi` with metrics widgets
- Wire to existing discovery adapters (GitHub, Okta, Google Workspace)

### 3. CF Decommission Prep (after 2026-04-25 stability window)

- Audit remaining CF Worker bindings (adapters still on CF)
- Plan adapter Lambda migration (9 adapters, same pattern as core)
- Update DNS to remove CF proxy (already on Route 53)

### 4. Housekeeping

- Rotation-safe DB auth — wire 8 Lambdas to fetch RDS password from Secrets Manager at runtime (pg `password` async callback), then re-enable rotation on `rds!db-8b55494d-...` (disabled 2026-04-17 as stopgap after rotation broke login)
- Remove `console-app/build/` from git tracking (stale build artifacts committed)
- Fix `stream.evidence.test.ts` WorkflowEntrypoint failure (CF Workers reference in AWS world)
- Remove 125 dead SvelteKit `+server.ts` files (D1-backed, no longer used)

## Key Files

| Purpose          | Path                                |
| ---------------- | ----------------------------------- |
| Demo script      | `DEMO-SCRIPT.md`                    |
| Status tracker   | `STATUS.md`                         |
| Lambda functions | `lambdas/` (7 functions)            |
| Terraform infra  | `infra/aws/` (18 files)             |
| Console app      | `console-app/` (SvelteKit SPA)      |
| Shared packages  | `packages/shared/src/platform/aws/` |

## Build & Deploy

```bash
# Console-app (SPA to S3)
cd console-app
SVELTE_CONFIG=svelte.config.aws.js VITE_API_URL=https://ahjoepuw96.execute-api.us-east-1.amazonaws.com pnpm build
aws s3 sync build/ s3://atlasit-console-dev-457335975503 --delete
aws cloudfront create-invalidation --distribution-id E1AHLAH04F9IIZ --paths "/*"

# Lambda rebuild + deploy
node scripts/build-lambdas.mjs --function <name>
cd lambdas/<name>/dist && npm install pg && cd ..
powershell Compress-Archive -Path dist/handler.js,dist/node_modules -DestinationPath dist/lambda.zip -Force
aws lambda update-function-code --function-name atlasit-<name>-dev --zip-file "fileb://lambdas/<name>/dist/lambda.zip"
```
