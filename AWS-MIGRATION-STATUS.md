# AWS Migration -- Completion Roadmap

**Last updated:** 2026-04-10
**Purpose:** Single source of truth for completing the Cloudflare to AWS migration.
**Rule:** No platform development (Phases 9-12) until this document shows all phases complete.

---

## Current State

**Production traffic:** 100% Cloudflare Workers. Zero Lambda in the critical path.
**AWS infrastructure:** Deployed and verified (RDS db.t4g.small, 6 Lambda functions, API Gateway, VPC, DynamoDB, S3, SQS).
**Cost:** ~$26/mo (down from ~$250/mo after orphan cleanup).
**Terraform state:** 122 resources. Partial drift remains (Lambda SG, IGW, public RT associations, EventBridge schedulers).

### What Works on AWS (verified via direct Lambda invoke)
- Health endpoints (all 6 Lambdas return 200)
- Auth validation (SSM SecureString reads, internal API key flow)
- PostgreSQL queries (RDS db.t4g.small, 35-table schema applied)
- DynamoDB access (feature flags CRUD)
- API Gateway routing (ahjoepuw96.execute-api.us-east-1.amazonaws.com)

### What Does NOT Work / Not Migrated
- Console app (SvelteKit on CF Pages, not S3/CloudFront)
- ~55 Lambda routes not ported from CF Workers
- Data migration scripts exist but have NOT been run (D1, KV, R2 all still on CF)
- DNS still on Cloudflare (atlasit.pro)
- CI/CD deploy-on-merge still CF-only (Lambda deploy is a separate workflow)
- DLQ processor Lambda not created in AWS
- EventBridge schedulers not created
- SQS event source mappings not connected
- Automation rule Step Function not created
- 35 adapters still on CF Workers (migrate last)

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

### M1.2 -- orchestrator routes (24 missing)
- [ ] GET /api/v1/workflows/:id
- [ ] POST /api/v1/workflows/:id/steps/:stepId/complete
- [ ] POST /api/v1/workflows/:id/steps/:stepId/fail
- [ ] POST /api/v1/workflows/:id/cancel
- [ ] GET /api/v1/dead-letter/:id
- [ ] POST /api/v1/dead-letter/:id/replay
- [ ] POST /api/v1/automation/nl
- [ ] GET/PATCH/DELETE /api/v1/agents/:id
- [ ] POST /api/v1/agents/:id/subscriptions
- [ ] POST /api/v1/agents/:id/health
- [ ] POST /api/v1/discovery/scan
- [ ] GET /api/v1/discovery/apps
- [ ] PATCH /api/v1/discovery/apps/:id
- [ ] GET /api/v1/discovery/grants
- [ ] GET /api/v1/stream/evidence
- [ ] GET /api/v1/stream, /api/v1/stream/recent
- [ ] GET /api/v1/stream/workflow/:id
- [ ] POST /api/v1/nhi/discover, /api/v1/nhi/sync
- [ ] GET /api/v1/nhi/credentials
- [ ] GET /api/v1/jml/runs/:id

### M1.3 -- compliance-api routes -- COMPLETE (2026-04-10)
9 fully implemented, 6 stubbed as 501 (access_requests + notifications tables not in PG schema).

- [x] POST /api/evidence/ingest
- [x] GET /api/evidence/*
- [x] GET /api/v1/activity
- [x] GET/POST /api/v1/incidents
- [x] GET/POST /api/v1/access-requests (501 stub -- needs PG migration)
- [x] POST /api/v1/access-requests/:id/* (501 stub)
- [x] GET /api/v1/notifications (501 stub -- needs PG migration)
- [x] POST /api/v1/notifications/read, /api/v1/notifications/read-all (501 stub)
- [x] GET /api/v1/policies/coverage/*
- [x] POST /api/v1/admin/retention/policies/purge
- [x] GET /api/v1/workflows/demo/jml
- [x] GET /api/v1/workflows/executions/*

### M1.4 -- onboarding routes (3 missing)
- [ ] POST /onboarding/submit
- [ ] POST /api/onboarding
- [ ] GET /api/onboarding/*

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

### M2.2 -- Console app deployment
- [ ] Configure SvelteKit adapter-static (or adapter-node)
- [ ] Deploy built assets to S3 atlasit-console-dev bucket
- [ ] Verify CloudFront serves console correctly
- [ ] Update console API proxy routes to hit API Gateway (not CF Workers)

### M2.3 -- CI/CD unification
- [ ] Merge deploy-lambdas.yml logic into deploy-on-merge.yml
- [ ] Add console S3 deploy job
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

### M4.1 -- API smoke tests
- [ ] Run scripts/smoke-test-aws.sh dev -- all endpoints green
- [ ] Test every route category: tenants, events, flags, credentials, compliance, workflows
- [ ] Verify auth flows: Bearer token, API key, internal service-to-service

### M4.2 -- Console app QA
- [ ] Console loads from CloudFront
- [ ] Login/auth works
- [ ] Dashboard renders with real data
- [ ] Compliance scores display
- [ ] Directory lists users
- [ ] Settings pages functional
- [ ] Log all UI/UX issues (broken, missing, disconnected)

### M4.3 -- Workflow testing
- [ ] JML workflow via Step Functions (joiner/mover/leaver paths)
- [ ] Automation rule evaluation + action execution
- [ ] SQS consumer processes queue messages
- [ ] DLQ processor handles failures
- [ ] EventBridge schedulers fire (compliance scoring, daily eval)

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
- [ ] Link CloudFront to atlasit.pro + *.atlasit.pro aliases
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
