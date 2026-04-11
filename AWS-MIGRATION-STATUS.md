# AWS Migration -- Completion Roadmap

**Last updated:** 2026-04-11
**Purpose:** Single source of truth for completing the Cloudflare to AWS migration.
**Rule:** No platform development (Phases 9-12) until this document shows all phases complete.

---

## Current State (2026-04-11)

**Production traffic:** 100% Cloudflare Workers. AWS is ready but not serving production yet.
**AWS API:** 21/21 routes passing through API Gateway (ahjoepuw96.execute-api.us-east-1.amazonaws.com)
**Cost:** ~$26/mo
**Terraform:** Zero drift ("No changes. Your infrastructure matches the configuration.")

### What Works on AWS

- 7 Lambda functions deployed (core-api, compliance-api, orchestrator, onboarding-api, scheduler, slack-handler, dlq-processor)
- All routes accessible through API Gateway with path prefix stripping
- RDS db.t4g.small with 35+ tables (schema applied + agent_registry, workflow_runs, workflow_steps added)
- DynamoDB (sessions, cache, feature-flags, idempotency)
- SSM SecureString secrets (7 secrets + database-url)
- SQS consumers connected (step_tasks -> orchestrator, DLQ -> dlq-processor) -- verified message consumed
- 3 EventBridge schedulers ENABLED (5min scoring, 2am daily eval, 15min dispatch)
- 2 Step Functions (jml-workflow, automation-rule)
- NAT instance (t4g.nano) with IP forwarding for Lambda VPC outbound
- S3 buckets (evidence, policies, artifacts, console, logs)
- CloudFront + WAF (2 rules: ip-reputation + rate-limit)
- Console S3 deploy workflow (.github/workflows/deploy-console-s3.yml) + svelte.config.aws.js

### What Does NOT Work / Not Migrated

- Console app not deployed to S3 (workflow exists but hasn't run)
- Data migration not run (D1/KV/R2 still on CF -- needs CLOUDFLARE_API_TOKEN)
- DNS still on Cloudflare (atlasit.pro)
- 35 adapters still on CF Workers
- DATABASE_URL managed via CLI/SSM, NOT Terraform (Terraform has ignore_changes on Lambda env)
- NAT instance route must be manually updated if instance is replaced

### Known Issues

- Terraform will try to replace NAT instance if user_data changes (route goes blackhole until manually fixed)
- 6 compliance-api routes return 501 (access_requests + notifications tables not in PG schema)
- Agent/workflow routes: some D1-only columns not in PG schema (non-blocking, routes return empty data)

---

## Phase M1 -- Route Completion (Code Parity)

**Goal:** Every CF Worker route has a working Lambda equivalent.
**Blocked by:** Nothing. Start immediately.
**Estimate:** ~55 route handlers across 4 Lambda functions.

### M1.1 -- core-api routes -- COMPLETE

All 13 routes already implemented in initial port. Verified 2026-04-10.

- [x] GET/PATCH/DELETE /api/v1/tenants/:id
- [x] GET /api/v1/events/:id
- [x] POST /api/v1/auth/token
- [x] GET/POST/PATCH/DELETE /api/v1/flags/:key
- [x] POST /api/v1/flags/:key/evaluate
- [x] POST /api/v1/flags/:key/kill
- [x] GET/PUT/DELETE /api/v1/credentials/:tenantId/:appId
- [x] POST /api/v1/credentials/:tenantId/:appId/test

### M1.2 -- orchestrator routes -- COMPLETE (2026-04-11)

All routes implemented in `lambdas/orchestrator/src/routes.ts`. Verified 2026-04-11.

- [x] Workflow: GET /api/v1/workflows/:id, complete step, fail step, cancel
- [x] Dead-letter: GET entries, GET single, replay, replay-all, stats
- [x] Agents: list, get, create (POST), update (PATCH), delete, subscriptions, health
- [x] Discovery: scan, apps, grants, PATCH app risk tier
- [x] Stream: evidence, recent, workflow-scoped, activity stream (JSON snapshot, SSE not supported on Lambda)
- [x] NHI: discover, sync, credentials (adapter-based routes enqueue via SQS)
- [x] JML: policy GET/PUT, trigger, changelog, runs, runs/:id
- [x] Automation: execute, evaluate, rules list/create, stats, NL builder
- [x] Directory: sync
- [x] Events: publish, list, get by ID

### M1.3 -- compliance-api routes -- COMPLETE (2026-04-10)

9 fully implemented, 6 stubbed as 501 (access_requests + notifications tables not in PG schema).

- [x] POST /api/evidence/ingest
- [x] GET /api/evidence/\*
- [x] GET /api/v1/activity
- [x] GET/POST /api/v1/incidents
- [x] GET/POST /api/v1/access-requests (501 stub -- needs PG migration)
- [x] POST /api/v1/access-requests/:id/\* (501 stub)
- [x] GET /api/v1/notifications (501 stub -- needs PG migration)
- [x] POST /api/v1/notifications/read, /api/v1/notifications/read-all (501 stub)
- [x] GET /api/v1/policies/coverage/\*
- [x] POST /api/v1/admin/retention/policies/purge
- [x] GET /api/v1/workflows/demo/jml
- [x] GET /api/v1/workflows/executions/\*

### M1.4 -- onboarding routes -- COMPLETE (2026-04-11)

All routes implemented in `lambdas/onboarding-api/src/routes.ts`. Verified 2026-04-11.

- [x] POST /onboarding/submit (shared handler with /api/onboarding)
- [x] POST /api/onboarding
- [x] GET /api/onboarding/:tenantId
- [x] GET /api/onboarding/questions
- [x] POST /onboarding/start
- [x] GET /api/onboarding/sessions/:id

### M1.5 -- DLQ processor Lambda -- COMPLETE (2026-04-10)

- [x] Create atlasit-dlq-processor-dev Lambda in AWS
- [x] Connect SQS DLQ event source mapping
- [x] Connect SQS step_tasks -> orchestrator event source mapping

**Exit criteria:** All CF Worker routes exist in Lambda handlers. Build succeeds for all 7 functions.

---

## Phase M2 -- Infrastructure Completion

**Goal:** All AWS infrastructure operational.
**Blocked by:** Nothing. Runs in parallel with M1.

### M2.1 -- Terraform convergence -- COMPLETE (2026-04-10)

- [x] Fix remaining state drift (Lambda SG: switched name_prefix to name)
- [x] terraform plan shows: "No changes. Your infrastructure matches the configuration."
- [x] EventBridge schedulers created (5min scoring, 2am daily eval, 15min dispatch)
- [x] SQS event source mappings connected (step_tasks -> orchestrator, dlq -> dlq-processor)
- [x] Step Functions automation_rule state machine created
- [x] API Gateway path prefix stripping in all Lambda handlers (PR #407)

### M2.2 -- Console app deployment -- PARTIAL

Config ready, not yet executed. `console-app/svelte.config.aws.js` and `.github/workflows/deploy-console-s3.yml` exist.

- [x] Configure SvelteKit adapter-static (svelte.config.aws.js exists)
- [x] S3 deploy workflow created (.github/workflows/deploy-console-s3.yml)
- [ ] Deploy built assets to S3 atlasit-console-dev bucket (workflow exists but hasn't run)
- [ ] Verify CloudFront serves console correctly
- [ ] Update console API proxy routes to hit API Gateway (not CF Workers)

### M2.3 -- CI/CD unification -- PARTIAL

Standalone workflows exist, unification into deploy-on-merge.yml pending. `.github/workflows/deploy-lambdas.yml` (matrix deploy with OIDC) and `.github/workflows/deploy-console-s3.yml` exist.

- [x] Lambda deploy workflow created (.github/workflows/deploy-lambdas.yml with matrix + OIDC)
- [x] Console S3 deploy workflow created (.github/workflows/deploy-console-s3.yml)
- [ ] Merge deploy-lambdas.yml logic into deploy-on-merge.yml
- [ ] Keep CF Worker deploys during transition (dual-deploy)
- [ ] Add terraform-apply trigger on infra/aws/ changes

**Exit criteria:** terraform plan shows 0 changes. Console loads from CloudFront. CI deploys to both.

---

## Phase M3 -- Data Migration

**Goal:** All data from Cloudflare replicated to AWS.
**Blocked by:** CLOUDFLARE_API_TOKEN needed for wrangler D1/KV export. RDS import needs VPC access (use migration Lambda).

### M3.1 -- D1 -> RDS PostgreSQL

- [ ] Set CLOUDFLARE_API_TOKEN env var for wrangler access
- [ ] Run scripts/migrate-d1-to-aurora.sh (targets RDS now)
- [ ] Verify row counts match across all 35 tables
- [ ] Spot-check 3 tenants for data integrity

### M3.2 -- KV -> DynamoDB

- [ ] Run scripts/migrate-kv-to-dynamodb.sh
- [ ] Verify sessions, cache, feature-flags, idempotency populated
- [ ] Verify TTL fields set correctly

### M3.3 -- R2 -> S3

- [ ] Run scripts/migrate-r2-to-s3.sh
- [ ] Verify evidence, policies, artifacts bucket object counts match
- [ ] Verify SHA-256 checksums on evidence files

**Exit criteria:** All AWS data matches Cloudflare. Counts + checksums verified.

---

## Phase M4 -- Integration Testing and QA

**Goal:** Platform works end-to-end on AWS with no CF dependency.
**Blocked by:** M1 + M2 + M3.

### M4.1 -- API smoke tests -- COMPLETE (2026-04-11)

21/21 routes returning correct status codes through API Gateway.

- [x] Core API: health, auth, tenants, events, flags, credentials
- [x] Compliance API: health, incidents, activity
- [x] Orchestrator: health, events, rules, workflows, agents, dead-letter
- [x] Onboarding: health
- [x] Auth guard (401) and not-found (404) verified
- [x] Internal service-to-service auth via x-internal-api-key verified

### M4.2 -- Console app QA

- [ ] Console loads from CloudFront
- [ ] Login/auth works
- [ ] Dashboard renders with real data
- [ ] Compliance scores display
- [ ] Directory lists users
- [ ] Settings pages functional
- [ ] Log all UI/UX issues (broken, missing, disconnected)

### M4.3 -- Workflow testing -- PARTIAL (2026-04-11)

- [ ] JML workflow end-to-end (state machine exists, needs test execution)
- [ ] Automation rule end-to-end (state machine exists, needs test execution)
- [x] SQS consumer processes queue messages (verified: message consumed, depth 0)
- [x] DLQ processor connected and operational
- [x] EventBridge schedulers ENABLED (compliance-scoring, daily-eval, orchestrator-dispatch)

### M4.4 -- Adapter connectivity (subset)

- [ ] Test 2-3 core adapters against Lambda backend (Okta, Google Workspace, GitHub)
- [ ] Verify adapter -> Lambda API -> RDS flow
- [ ] Adapters stay on CF Workers (migrate in M6)

### M4.5 -- Load testing

- [ ] k6 scripts against API Gateway
- [ ] Verify db.t4g.small handles load without CPU credit exhaustion
- [ ] Verify Lambda concurrency within limits

**Exit criteria:** All tests pass. UI/UX issues logged. Zero P0 blockers.

---

## Phase M5 -- DNS Cutover

**Goal:** atlasit.pro serves from AWS.
**Blocked by:** M4 (QA must pass).

### M5.1 -- Preparation

- [ ] Link CloudFront to atlasit.pro + \*.atlasit.pro aliases
- [ ] Verify ACM certificate associated with CloudFront
- [ ] Lower Cloudflare DNS TTL to 60s (wait 72h)

### M5.2 -- Progressive cutover

- [ ] scripts/dns-cutover.sh canary-1pct -- 1% to AWS, monitor 1h
- [ ] 20% -- monitor 1h
- [ ] 50% -- monitor 2h
- [ ] 99% -- monitor 4h
- [ ] 100% -- full AWS

### M5.3 -- Nameserver migration

- [ ] Update registrar nameservers from Cloudflare to Route 53
- [ ] Verify DNS propagation from multiple regions
- [ ] 2-week stability window (CF available for rollback)

**Exit criteria:** atlasit.pro resolves to CloudFront. All traffic on AWS. CF available for rollback.

---

## Phase M6 -- Adapter Migration and CF Decommission

**Goal:** Move remaining CF Workers to Lambda. Decommission Cloudflare.
**Blocked by:** M5.

### M6.1 -- Adapter migration

- [ ] Port 9 core-tier adapters to Lambda (Okta, Google Workspace, M365, Slack, GitHub, Jira, Stripe, AWS, Azure)
- [ ] Scaffolded adapters (24) remain stubs until needed

### M6.2 -- Remaining CF Workers

- [ ] Port or consolidate: dispatch-worker, email-worker, documentation-worker, apex-redirect, marketplace
- [ ] Handle apex redirect via CloudFront Function (already exists)

### M6.3 -- Cloudflare decommission

- [ ] Archive: scripts/cloudflare-export.sh
- [ ] Delete CF Workers, D1 databases, KV namespaces, R2 buckets
- [ ] Downgrade/cancel Cloudflare plan

**Exit criteria:** Zero Cloudflare resources. Migration complete.

---

## Phase M7 -- Post-Migration QA and Roadmap Re-evaluation

**Goal:** Verify stability. Re-evaluate platform roadmap.
**Blocked by:** M6.

### M7.1 -- Production stability (2 weeks)

- [ ] CloudWatch alarms: zero false positives
- [ ] RDS metrics: CPU/memory/connections within thresholds
- [ ] Lambda errors: less than 0.1% rate
- [ ] Costs: confirm ~$26/mo

### M7.2 -- Comprehensive QA

- [ ] Full test suite against AWS endpoints
- [ ] Address all UI/UX issues from M4.2
- [ ] Verify all 5 compliance frameworks score correctly
- [ ] Verify evidence pipeline end-to-end

### M7.3 -- Roadmap re-evaluation

- [ ] Assess Phases 9-12 with AWS context
- [ ] Identify features that benefit from AWS services
- [ ] Update ROADMAP.md with revised priorities
- [ ] Resume platform development

**Exit criteria:** 2 weeks stable. QA clean. Roadmap updated. Ready for Phase 9.
