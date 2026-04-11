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

## Phase M3 -- Data Migration -- COMPLETE (2026-04-11)

**Goal:** All data from Cloudflare replicated to AWS.

### M3.1 -- D1 -> RDS PostgreSQL -- COMPLETE (2026-04-11)
- [x] Run data migration (23 tables, 1,151 rows migrated)
- [x] Key tables: tenants (6), compliance_evidence (706), automation_rules (55), audit_log (97)
- [x] Schema gaps fixed: added missing columns (owner_email, size, disabled_at, etc.)
- KV namespaces: empty (no data to migrate)
- R2 buckets: empty (no data to migrate)

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

### M4.2 -- Console app QA -- COMPLETE (2026-04-11)
- [x] Console loads from CloudFront (https://d2n7wudxrqfpwn.cloudfront.net)
- [x] 15 routes return 200 (SPA routing via custom error responses)
- [x] JS bundles and static assets load (165 files, 2MB)
- [x] Login page renders with auth form
- [x] API Gateway CORS configured for CloudFront origin
- [x] Fixed: SPA routing (CloudFront custom_error_response 403/404 → index.html)
- [x] Fixed: Svelte 5 compat (stopPropagation modifier, empty try block)
- [x] Fixed: CI build (shared package build step, pnpm version, config swap)

### M4.3 -- Workflow testing -- COMPLETE (2026-04-11)
- [x] JML trigger via API (joiner/mover/leaver) → SQS enqueue verified
- [x] Automation rules list (43 rules from D1 migration)
- [x] Workflow runs list (15 runs)
- [x] DLQ depth: 0 (clean)
- [x] Step Functions: 2 state machines exist (jml-workflow, automation-rule)
- [x] SQS consumer processes messages

### M4.4 -- Adapter connectivity -- PARTIAL (2026-04-11)
- [x] Adapter Lambda functions created (9 core adapters)
- [x] API Gateway routes configured (/adapters/{name}/{proxy+})
- [x] ADAPTER_URLS stored in SSM
- [ ] Adapter code deployed to Lambda functions (Lambda wrappers ready, code not yet pushed)
- [ ] End-to-end adapter test (requires adapter code deployment)

### M4.5 -- Load testing -- COMPLETE (2026-04-11)
- [x] 100/100 requests, 0 failures
- [x] Health endpoint: 291ms avg
- [x] Evidence list (PG query): 249ms avg
- [x] No throttling or errors under sustained load

## Phase M5 -- DNS Cutover -- IN PROGRESS (2026-04-11)

**Goal:** atlasit.pro serves from AWS.

### M5.1 -- Preparation -- COMPLETE
- [x] CloudFront aliases: atlasit.pro + *.atlasit.pro
- [x] ACM certificate issued and associated
- [x] Custom error responses for SPA routing

### M5.2 -- Progressive cutover -- COMPLETE (2026-04-11)
- [x] www.atlasit.pro → CloudFront (d2n7wudxrqfpwn.cloudfront.net)
- [x] atlasit.pro → CloudFront (CNAME flattened, TTL:60)
- [x] Root domain redirects to www (CloudFront function)
- [x] API subdomains (api, compliance, orchestrator, dispatch) remain on CF Workers during adapter transition

### M5.3 -- Nameserver migration
- [ ] Update registrar nameservers from Cloudflare to Route 53
- [ ] Verify DNS propagation
- [ ] 2-week stability window

## Phase M6 -- Adapter Migration -- IN PROGRESS (2026-04-11)

**Goal:** Move remaining CF Workers to Lambda. Decommission Cloudflare.

### M6.1 -- Adapter Lambda infrastructure -- COMPLETE
- [x] 9 core adapter Lambda functions created via Terraform
- [x] API Gateway routes: /adapters/{name}/{proxy+}
- [x] Lambda compatibility wrappers (hono-lambda-adapter.ts) in each adapter
- [x] ADAPTER_URLS SSM parameter set

### M6.2 -- Adapter code deployment -- COMPLETE (2026-04-11)
- [x] 9 adapters built with esbuild (inlined hono-lambda-adapter)
- [x] Path prefix stripping for API Gateway routes
- [x] 7/9 adapters returning 200 on health (okta + aws need CF binding fixes)
- [x] ADAPTER_URLS SSM parameter configured

### M6.3 -- Cloudflare decommission -- DEFERRED
**Do NOT delete CF resources until M7 stability window (2 weeks) confirms AWS is stable.**

CF resources to decommission after stability confirmed:
- 46 AtlasIT Workers (core + adapters + support workers)
- 6 AtlasIT D1 databases (atlasit-shared, atlasit_compliance, atlas_*)
- 3 KV namespaces (KV_CACHE, ATLAS_FLAGS, KV_FEATURE_FLAGS)
- 5 R2 buckets (atlas-artifacts, atlas-evidence, atlas-policies, atlasit-evidence, atlasit-evidence-dev)
- API subdomain DNS records (api, compliance, orchestrator, dispatch)


- [ ] Archive CF Workers, D1, KV, R2
- [ ] Verify no traffic on CF Workers
- [ ] Downgrade/cancel Cloudflare plan

## Phase M7 -- Post-Migration Stability (starts 2026-04-11)

**Goal:** 2 weeks stable on AWS before decommissioning CF.

### M7.1 -- Stability monitoring (2 weeks: 2026-04-11 → 2026-04-25)
- [ ] CloudWatch alarms: zero false positives
- [ ] RDS metrics: CPU/memory/connections within thresholds
- [ ] Lambda errors: <0.1% rate
- [ ] Costs: confirm ~$26/mo
- [ ] Zero rollback needed

### M7.2 -- Comprehensive QA
- [ ] All compliance frameworks score correctly with migrated data
- [ ] Evidence pipeline end-to-end (adapter → evidence → score)
- [ ] Fix remaining adapter issues (okta + aws CF binding deps)
- [ ] Address any UI/UX issues found during console use

### M7.3 -- Roadmap re-evaluation
- [ ] Assess Phases 9-12 with AWS context
- [ ] Update ROADMAP.md with revised priorities
- [ ] Resume platform development

**Exit criteria:** 2 weeks stable. QA clean. CF decommissioned. Ready for Phase 9.
