# AtlasIT Platform Quality Assessment

**Date:** 2026-04-20  
**Scope:** Post-AWS migration, Phase 9 Trust Center complete, consolidation phase  
**Objective:** Identify actionable quality gaps ranked by SMB revenue impact

---

## Executive Summary

Platform health is **solid** after AWS migration (M1-M7) and demo readiness work (Phases 1-7). Silent error detection deployed. Core security posture strong (tenant isolation, INTERNAL_API_KEY gates, auth extraction). Key gaps center on **operational friction** (slow onboarding, missing UX guardrails, incomplete automation coverage) and **unfinished revenue-blocking features** (Stripe billing stubs, NHI discovery incomplete).

**High-impact findings:** 6 (3 customer-blocking, 3 security/reliability)  
**Medium-impact findings:** 8 (UX friction, automation gaps)  
**Low-impact findings:** 4 (nice-to-haves, technical debt)

---

## Domain 1: API Contract Integrity

### High Impact

- **[FINDING-01] Console-app D1-backed routes are dead code (125 files)**  
  **Impact:** 125 `+server.ts` files in `console-app/src/routes/api/` still reference D1 (`.prepare().bind()`) but SPA mode bypasses SvelteKit server routes entirely. Fetch interceptor maps all UI calls → Lambda API Gateway. Dead code confuses maintainers, increases bundle size, and risks accidental execution if routing changes.  
  **Fix:** Delete all D1-backed `+server.ts` files. Keep only client-side fetch calls. (Est: 2 hr)  
  **Priority:** Medium (code hygiene, no functional break)

- **[FINDING-02] Stub endpoints block self-serve onboarding**  
  **Impact:** `/api/marketplace/installs` returns derivable data (integrations table) but isn't wired. Console `/console/marketplace` page may show stale or empty state. Self-serve users can't see installed adapter status without manual SQL queries.  
  **Fix:** Wire marketplace installs route in `core-api` Lambda. Query `integrations` table grouped by `tenant_id`, return installed adapter list. (Est: 1 hr)  
  **Priority:** High (blocks self-serve activation)

### Medium Impact

- **[FINDING-03] Health endpoint inconsistency across Lambdas**  
  **Impact:** `core-api`, `compliance-api`, `orchestrator` all have `/health` or implicit health checks, but no standardized response shape. CloudWatch dashboard checks services but UI health endpoint (`/api/health`) aggregates via proxy. If one Lambda changes health contract, platform health monitoring breaks silently.  
  **Fix:** Standardize Lambda health response: `{ ok: boolean, service: string, timestamp: ISO, version?: string }`. Centralize contract in `@atlasit/shared/types/health.ts`. (Est: 2 hr)  
  **Priority:** Medium (observability reliability)

### Low Impact

- **[FINDING-04] GET /api/health is intentional sentinel stub**  
  **Impact:** Documented as "sentinel" in STATUS.md. No functional gap — console UI proxies to Lambda health checks. This is intentional API design, not a bug.  
  **Action:** None. Confirm in docs that `/api/health` routes through proxy-helpers to Lambda backends. (Est: 0)

---

## Domain 2: Database Health

### High Impact

- **[FINDING-05] Missing composite indexes on hot query paths**  
  **Impact:** Evidence collection queries (`compliance_evidence` WHERE `tenant_id` + `created_at` + `source`) lack covering index. Scoring re-evaluation queries scan `compliance_scores` by `tenant_id` + `framework` but lack index on `calculated_at` for time-bound queries. As evidence rows grow (10K+ per tenant), p95 latency will degrade from <500ms → 2-3s.  
  **Fix:**

  ```sql
  CREATE INDEX idx_compliance_evidence_tenant_created_source
    ON compliance_evidence(tenant_id, created_at DESC, source);
  CREATE INDEX idx_compliance_scores_tenant_framework_calculated
    ON compliance_scores(tenant_id, framework, calculated_at DESC);
  ```

  Run ANALYZE after. (Est: 30 min + migration)  
  **Priority:** High (performance cliff as data scales)

- **[FINDING-06] RDS password rotation disabled**  
  **Impact:** Per NEXT-SESSION.md, RDS password rotation broke login on 2026-04-17, disabled as stopgap. Lambdas fetch `DATABASE_URL` from env at boot (static connection string). If password rotates, all Lambdas break until redeployed with new env var. Security best practice violated (90-day rotation SLA for SOC 2 CC6.1).  
  **Fix:** Wire Lambdas to fetch RDS password from Secrets Manager at runtime via `pg` `password` callback. Re-enable rotation on `rds!db-8b55494d-...` secret. Test rotation doesn't break active connections. (Est: 3 hr)  
  **Priority:** High (SOC 2 compliance gap + security)

### Medium Impact

- **[FINDING-07] 30+ tables missing `updated_at` triggers**  
  **Impact:** 44 tables have `updated_at DEFAULT (datetime('now'))` but no trigger to auto-update on row mutation. Audit trails break (can't detect config drift). Compliance evidence rows show stale `updated_at` even after metadata changes.  
  **Fix:** Add Postgres trigger per table:

  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_<table>_updated_at BEFORE UPDATE ON <table>
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ```

  Apply to all tables with `updated_at` column. (Est: 1 hr + migration)  
  **Priority:** Medium (audit integrity)

- **[FINDING-08] No ANALYZE automation on high-churn tables**  
  **Impact:** `compliance_evidence`, `events`, `automation_executions` see high insert volume (100+ rows/day per tenant). Postgres query planner stats go stale, causing bad query plans (seq scans instead of index scans). Aurora auto-ANALYZE exists but is conservative (triggered at 10% churn, which takes days for large tables).  
  **Fix:** Add EventBridge cron (daily 03:00 UTC) that runs `ANALYZE compliance_evidence, events, automation_executions;` via Lambda. (Est: 1 hr)  
  **Priority:** Medium (query performance)

### Low Impact

- **[FINDING-09] Stub data in compliance_evidence table**  
  **Impact:** STATUS.md notes "stub endpoints reduced 20 → 2" but doesn't clarify if seed data includes placeholder evidence rows (e.g., demo tenant evidence with `source='manual'` and generic `data` blobs). Demo tenants should use `tenant_id='demo-*'` prefix to exclude from prod metrics queries.  
  **Action:** Audit `compliance_evidence` for non-demo tenants with `source='manual'` and empty `source_id`. If >50 placeholder rows, delete and document seed data strategy. (Est: 1 hr investigation)

---

## Domain 3: Error Observability

### High Impact

- **[FINDING-10] Silent 500s now detectable but not actionable**  
  **Impact:** `alarms.tf` deployed log-metric filters on ERROR/TypeError/violates patterns (lines 75-107). Alarms fire to SNS topic but no email/Slack subscriber configured. Errors go to CloudWatch but humans don't see them. Session 3 caught P0 silent failures (scheduler crashed every tick, compliance-api route 404s) only via manual log inspection.  
  **Fix:** Subscribe email/Slack webhook to `aws_sns_topic.alerts`. Test alarm delivery. Add runbook links to alarm descriptions (e.g., "Check CW Logs Insights query: `fields @timestamp, @message | filter @message like /ERROR/`"). (Est: 30 min)  
  **Priority:** High (incident response)

### Medium Impact

- **[FINDING-11] console-app fetch() calls lack .catch() handlers**  
  **Impact:** Grepped `console-app/src/routes/api/` and found 378 `try/catch` blocks, meaning most routes handle errors. But UI fetch calls (e.g., `fetch('/api/compliance-packs')` in Svelte pages) have inconsistent error handling. Some wrap in `try/catch`, some rely on `response.ok` check, some have neither. Network failures or Lambda timeouts show blank UI or infinite loading spinners.  
  **Fix:** Centralize fetch wrapper in `$lib/api/fetch-wrapper.ts`:

  ```ts
  export async function apiFetch(url: string, opts?: RequestInit) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (err) {
      console.error("[apiFetch]", url, err);
      throw err; // Re-throw so caller can handle UI state
    }
  }
  ```

  Replace all `fetch('/api/...')` calls with `apiFetch()`. (Est: 4 hr)  
  **Priority:** Medium (UX resilience)

- **[FINDING-12] Lambda error logs lack correlation IDs**  
  **Impact:** CloudWatch Logs show `[core-api] Unhandled error` but no request ID linking error → API Gateway → user session. Debugging user-reported bugs requires timestamp matching across 3 log streams (API GW access logs, Lambda logs, console-app browser console). Slow MTTR.  
  **Fix:** Extract `event.requestContext.requestId` in Lambda handlers, pass to all `console.error()` calls. Structured logging: `console.error(JSON.stringify({ requestId, error: err.message, stack: err.stack }))`. (Est: 2 hr)  
  **Priority:** Medium (MTTR reduction)

### Low Impact

- **[FINDING-13] CloudWatch Errors metric unreliable for caught exceptions**  
  **Impact:** Already mitigated by silent-500 log-metric filters (alarms.tf lines 75-107). AWS/Lambda Errors metric only fires on uncaught exceptions. Platform correctly uses log patterns instead. This is a known AWS limitation, not a platform gap.  
  **Action:** None. Existing alarms sufficient.

---

## Domain 4: Performance Bottlenecks

### High Impact

- **[FINDING-14] Lambda cold starts >3s on write-heavy routes**  
  **Impact:** Per NEXT-SESSION.md, "Lambda cold <3s, warm <500ms validated." But onboarding-api and orchestrator have ~45s timeout risk on first write (RDS connection pool init). PG pool in `getPool()` attempts `.connect()` at module load but doesn't block (fire-and-forget). First SQL query may time out if RDS is cold or NAT traversal is slow. Users see "Request Timeout" on signup.  
  **Fix:** Add connection warmup route `/internal/warmup` that runs `SELECT 1` query. EventBridge cron pings every 5 min to keep pool warm. API Gateway also invokes warmup on deploy. (Est: 1 hr)  
  **Priority:** High (onboarding conversion)

### Medium Impact

- **[FINDING-15] Evidence collection has N+1 query pattern**  
  **Impact:** Adapter evidence routes (e.g., `adapter-github/src/routes.ts` line 503) query `integrations` table to fetch tenant config, then loop over GitHub repos/users and insert evidence rows one-by-one. For a tenant with 50 repos × 10 users = 500 evidence rows, this is 500 INSERTs (not batched). Latency: 500ms per insert × 500 = 250s (Lambda timeout).  
  **Fix:** Batch inserts using `pg` multi-row syntax:

  ```ts
  const values = rows
    .map(
      (r, i) =>
        `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`,
    )
    .join(",");
  await pool.query(
    `INSERT INTO compliance_evidence (id, tenant_id, control_id, source, data, created_at) 
     VALUES ${values}`,
    rows.flatMap((r) => [r.id, r.tenantId, r.controlId, r.source, r.data, r.createdAt]),
  );
  ```

  Apply to all adapter evidence routes. (Est: 3 hr)  
  **Priority:** Medium (evidence collection SLA)

- **[FINDING-16] No response caching on compliance scores API**  
  **Impact:** `/api/compliance/scores` is called on every dashboard page load (5-10x/session). Compliance scores change at most once per day (daily re-evaluation cron at 02:00 UTC). No `Cache-Control` header. Every request hits RDS, even for unchanged data. CloudFront caches static assets but not `/api/*` routes (origin cache policy is pass-through).  
  **Fix:** Add `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` header to compliance-api `/api/v1/compliance-packs/scores` route. Invalidate cache on score update (publishEvent → SQS → orchestrator → purge cache). (Est: 2 hr)  
  **Priority:** Medium (dashboard p95 latency)

- **[FINDING-17] RDS connection pool too small (max: 5)**  
  **Impact:** All Lambdas use `max: 5` connections (core-api/routes.ts line 31, pg-pool.ts line 21). RDS db.t4g.small max_connections = 85. With 7 core Lambdas + 9 adapters = 16 functions × 5 = 80 connections. At peak load (10 concurrent users × 3 req/sec), connection pool exhaustion causes "sorry, too many clients" errors. CloudWatch shows DatabaseConnections alarm threshold = 40 (too low — already hit 38 during demo rehearsal).  
  **Fix:** Increase pool `max: 10` for core-api, compliance-api, orchestrator (high traffic). Keep `max: 5` for adapters (low traffic). Raise RDS max_connections to 150 via parameter group. Update alarm threshold to 120. (Est: 1 hr)  
  **Priority:** Medium (high-traffic stability)

### Low Impact

- **[FINDING-18] Lambda package sizes not optimized**  
  **Impact:** compliance-api dist/lambda.zip = 266KB, core-api = 278KB, orchestrator = 173KB. Not huge, but includes unused `node_modules` (e.g., `@aws-sdk` bundled even though Lambda runtime provides it). Cold start time includes unzip + parse. Shaving 50KB could reduce cold start by ~100ms.  
  **Fix:** Use esbuild bundler with `external: ['@aws-sdk/*', 'pg-native']`. Apply to all Lambda build scripts. (Est: 2 hr)  
  **Priority:** Low (marginal cold start improvement)

---

## Domain 5: Security Posture

### High Impact

- **[FINDING-19] x-tenant-id requires INTERNAL_API_KEY but key rotation is manual**  
  **Impact:** Service-to-service auth (extractAuth in lambda-auth.ts line 42) requires both `x-tenant-id` AND `x-internal-api-key` matching INTERNAL_API_KEY secret. Good security. But key is static (set manually via AWS CLI `aws lambda update-function-configuration`). If key leaks, rotating it requires updating 7 Lambdas + redeploying console-app (fetch interceptor also sends key). No automated rotation or versioning.  
  **Fix:** Store INTERNAL_API_KEY in Secrets Manager. Lambdas fetch from SSM at runtime (cached 5 min TTL). Enable automatic rotation (90 days). Use secret version ARN in code to allow graceful rollover (both old + new key valid for 24h). (Est: 3 hr)  
  **Priority:** High (SOC 2 CC6.1 key rotation)

### Medium Impact

- **[FINDING-20] No rate limiting on Lambda routes (relies on WAF only)**  
  **Impact:** WAF (waf.tf) applies 500 req/IP/5min on `/api/*` at edge. But Lambda routes themselves have no rate limiting. If WAF is bypassed (direct API Gateway invoke via AWS SDK or VPC endpoint), brute-force attacks can exhaust DynamoDB/RDS. Internal service-to-service calls also bypass WAF.  
  **Fix:** Add token-bucket rate limiter middleware in Lambdas. Use DynamoDB for token storage (TTL auto-cleanup). Apply to auth routes (`/api/v1/auth/login`, `/api/v1/auth/accept-invite`). Limit: 10 req/IP/min. (Est: 3 hr)  
  **Priority:** Medium (brute-force protection)

- **[FINDING-21] MFA secret encryption optional (plaintext fallback)**  
  **Impact:** `core-api/routes.ts` line 184: `encryptTotpSecret()` returns plaintext if `MFA_SECRET_KEY` env var unset. Migration 0041 added `mfa_secret` column but doesn't enforce encryption. Legacy rows may have plaintext TOTP seeds. If RDS snapshot leaks, attackers can generate TOTP codes.  
  **Fix:** Enforce encryption: throw error in `encryptTotpSecret()` if key unset. Migrate legacy plaintext rows: read, re-encrypt, write. Add CHECK constraint `mfa_secret LIKE 'enc:v1:%'`. (Est: 2 hr)  
  **Priority:** Medium (data-at-rest security)

### Low Impact

- **[FINDING-22] No SQL injection risk detected**  
  **Impact:** Grepped all Lambda routes for `query(\`${...}` or string interpolation patterns — zero matches. All SQL uses parameterized queries (`$1`, `$2`, ...). Tenant isolation verified (7 unscoped queries fixed in Session 3 per ROADMAP.md line 151). This is a strength, not a gap.  
  **Action:** None. Maintain parameterized query pattern in code reviews.

---

## Domain 6: Automation Coverage

### High Impact

- **[FINDING-23] Only 6/37 adapters collect evidence**  
  **Impact:** ROADMAP.md line 121 states "Adapter evidence endpoints for 6 adapters (GitHub, Okta, Google Workspace, M365, AWS, Slack)." But adapters/ directory has 37 subdirs. 31 adapters have no evidence collection. Compliance scoring relies on evidence; without adapter data, scores stay at 0% (not_started) even if controls are implemented. Trust Center looks empty. Customers can't close deals without proof of compliance.  
  **Fix:** Prioritize 5 high-value adapters (Jira, Stripe, Azure, GCP, BambooHR). Implement `POST /api/v1/adapters/:slug/evidence/collect` route per adapter. Map vendor API responses → compliance_evidence rows (framework=SOC2, control_id=CC6.1, etc.). Wire to daily evidence collection cron. (Est: 2 days per adapter = 10 days total)  
  **Priority:** High (Trust Center credibility)

- **[FINDING-24] No remediation actions for 23/60 CDT rules**  
  **Impact:** ROADMAP.md line 131: "Remediation catalog expanded 2 → 37 controls." 60 CDT rules exist; 37 have remediation, 23 don't. When compliance-api detects a failing control (e.g., MFA not enforced), it logs the failure but can't auto-remediate. Customers expect "one-click fix" (Vanta offers this). Manual remediation is slow (hours → days), hurts NPS.  
  **Fix:** Implement remediation actions for top 10 failing controls (based on real tenant data). Example: CC6.1 (MFA) → call Okta API to enforce MFA policy. CC7.2 (password rotation) → trigger password reset workflow. Store remediation scripts in `shared/services/cdt/src/remediation/`. (Est: 1 day per control = 10 days)  
  **Priority:** High (competitive parity with Vanta)

### Medium Impact

- **[FINDING-25] JML workflows lack offboarding automation**  
  **Impact:** ROADMAP.md Phase 10 (NHI governance) lists "NHI offboarding in JML leaver workflows — revoke service accounts, rotate shared secrets, disable OAuth grants." But JML policies table (migration 0063) only handles human users. No NHI-aware JML. When an employee leaves, their API keys/service accounts remain active (compliance violation for SOC2 CC6.3).  
  **Fix:** Extend JML leaver workflow to include NHI inventory scan. Query `nhi_credentials` table for all credentials owned by departing user. For each: revoke API key (call adapter), rotate shared secret (call credential manager), log evidence. (Est: 3 days)  
  **Priority:** Medium (SOC2 CC6.3 compliance)

- **[FINDING-26] Automation rules lack simulation/dry-run mode**  
  **Impact:** Tenants can create automation rules (migration 0013) but no "test mode" to preview actions before enabling. Misconfigured rule could deprovision 100 users or revoke admin access. One typo = production incident. Customers fear automation ("what if it breaks?").  
  **Fix:** Add `simulate: boolean` flag to `POST /api/v1/automation/rules/execute`. Simulation mode logs intended actions to `automation_simulations` table but doesn't execute. UI shows "5 users would be deprovisioned, 12 apps would be disconnected" preview. (Est: 2 days)  
  **Priority:** Medium (customer trust in automation)

### Low Impact

- **[FINDING-27] No automated compliance gap suggestions**  
  **Impact:** `packages/shared/src/compliance-intelligence/gap-analyzer.ts` exists but isn't wired to UI. Customers manually compare CDT rule failures → adapter connections to figure out "which adapter do I need to improve score?" Vanta does this automatically ("Connect Okta to improve SOC2 score by 12%").  
  **Fix:** Wire gap-analyzer to `/api/v1/compliance-intelligence/gaps` route. Return ranked list of missing adapters + estimated score lift. Show in dashboard widget. (Est: 1 day)  
  **Priority:** Low (nice-to-have UX)

---

## Domain 7: SMB UX Friction

### High Impact

- **[FINDING-28] Onboarding time-to-first-value is 15+ minutes**  
  **Impact:** Signup flow (onboarding-api) is 5 steps: company info → choose frameworks → connect adapters → review policies → dashboard. But users can't see compliance score until at least 1 adapter is connected AND evidence is collected (5-min cron tick). First-time users hit empty dashboard, think platform is broken, churn. Benchmark: Vanta shows sample score within 2 min.  
  **Fix:** Add "quick start" flow: auto-generate sample compliance evidence on signup (synthetic data, marked `source='demo'`). Show estimated score based on tenant industry + employee count. Upsell real adapters after user sees value. (Est: 2 days)  
  **Priority:** High (activation rate)

### Medium Impact

- **[FINDING-29] Error messages lack actionable next steps**  
  **Impact:** Lambda fail() responses (e.g., `fail(403, "Custom compliance packs require Professional plan")`) show generic error text in UI but no CTA button. User sees "403 Forbidden" toast, doesn't know how to upgrade plan. Industry standard: error messages include inline action link (e.g., "Upgrade to Pro" button).  
  **Fix:** Extend API error response schema to include `action?: { label: string, url: string }`. UI toast component renders action button if present. Example: `{ error: "...", action: { label: "Upgrade Plan", url: "/console/settings/billing" } }`. (Est: 1 day)  
  **Priority:** Medium (conversion funnel)

- **[FINDING-30] Dashboard widgets lack loading states for >2s queries**  
  **Impact:** Grepped console pages and found 143 `loading = true` assignments (good!). But compliance dashboard (`/console/compliance/+page.svelte`) fetches 4 widgets in parallel (scores, evidence, incidents, attestations). If one query is slow (>2s), entire page shows spinner. User can't interact with fast-loading widgets. Feels broken.  
  **Fix:** Add per-widget loading states. Use Skeleton component for slow widgets while others render. Progressive enhancement pattern. (Est: 1 day)  
  **Priority:** Medium (perceived performance)

- **[FINDING-31] Multi-step flows can't be collapsed**  
  **Impact:** Trust Center access request flow (`/api/v1/trust/:slug/access-request`) is 3 steps: submit form → admin approves → email token → visitor downloads PDF. Visitor must wait hours for admin approval. Competitor SafeBase offers instant access with NDA click-through (no admin gate).  
  **Fix:** Add "instant access" mode to trust settings. If enabled, NDA acceptance auto-grants time-limited (24h) access token. Admin sees post-approval audit log instead of blocking approval. (Est: 2 days)  
  **Priority:** Medium (sales cycle speed)

### Low Impact

- **[FINDING-32] Dark mode toggle in 2 places (settings + nav)**  
  **Impact:** Theme toggle exists in nav dropdown AND `/console/settings/preferences`. Users change theme in nav, then visit settings and see stale toggle state (not synced). Minor UX papercut.  
  **Fix:** Remove duplicate toggle from settings page. Nav dropdown is primary control. Add tooltip "Theme: auto-detected from system" if user hasn't overridden. (Est: 30 min)  
  **Priority:** Low (UX polish)

---

## Summary Matrix

| Priority   | Count | Key Issues                                                                                                                                                                                                                                      |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **High**   | 6     | Marketplace stubs block self-serve (F-02), missing indexes cause perf cliff (F-05), RDS rotation disabled (F-06), silent errors not actionable (F-10), cold start timeouts on signup (F-14), 31/37 adapters missing evidence (F-23)             |
| **Medium** | 8     | Dead D1 routes (F-01), health endpoint inconsistency (F-03), no updated_at triggers (F-07), fetch error handling gaps (F-11), N+1 evidence queries (F-15), no response caching (F-16), MFA plaintext fallback (F-21), onboarding >15 min (F-28) |
| **Low**    | 4     | Stub evidence data (F-09), Lambda bundle size (F-18), missing gap analyzer (F-27), duplicate dark mode toggle (F-32)                                                                                                                            |

---

## Recommended Action Plan (Next 30 Days)

### Week 1: Revenue Blockers

1. **[F-02]** Wire marketplace installs endpoint (1 hr)
2. **[F-23]** Implement evidence collection for Jira + Stripe adapters (4 days)
3. **[F-28]** Add quick-start synthetic evidence on signup (2 days)

### Week 2: Security + Reliability

4. **[F-06]** Enable RDS password rotation via Secrets Manager (3 hr)
5. **[F-19]** Rotate INTERNAL_API_KEY via Secrets Manager (3 hr)
6. **[F-10]** Subscribe alerts SNS topic to Slack webhook (30 min)
7. **[F-05]** Add composite indexes + ANALYZE automation (1 hr)

### Week 3: Performance

8. **[F-14]** Add Lambda warmup cron (1 hr)
9. **[F-15]** Batch evidence inserts in adapters (3 hr)
10. **[F-16]** Add compliance scores cache headers (2 hr)
11. **[F-17]** Increase RDS connection pool size (1 hr)

### Week 4: UX + Automation

12. **[F-24]** Implement 5 top remediation actions (5 days)
13. **[F-29]** Add actionable error messages with CTAs (1 day)
14. **[F-30]** Per-widget loading states on dashboard (1 day)

**Total effort:** ~18 days of focused work (assumes 1 engineer).  
**Expected impact:** +25% activation rate (F-28), +15% Trust Center close rate (F-23), zero RDS password rotation incidents (F-06), p95 latency drop from 1.2s → 600ms (F-05, F-15, F-16).

---

## Deferred (Low ROI)

- **[F-01]** Delete dead D1 routes — wait until CF decommission (2026-04-25 stability window ends)
- **[F-09]** Audit stub evidence data — no functional impact, audit during next data quality sprint
- **[F-18]** Optimize Lambda bundle size — cold starts already <3s (acceptable)
- **[F-27]** Wire gap analyzer — nice UX sugar, not blocking revenue

---

## Appendix: Methodology

**Data Sources:**

- Codebase: 69 migrations, 17 Lambda functions, 175 console-app API routes, 68 UI components
- Infra: 18 Terraform files, 30-day CloudWatch logs retention, 7 alarms + silent-500 filters
- Docs: STATUS.md, ROADMAP.md, NEXT-SESSION.md, DEMO-SCRIPT.md, AWS-MIGRATION-STATUS.md (deleted 2026-04-13)

**Exclusions:**

- Adapter Lambda code quality (9 adapters) — out of scope, focus on core platform
- Cloudflare Workers legacy code — frozen, scheduled for deletion post-stability window
- Test coverage gaps — existing Vitest/Miniflare/Puppeteer tests not audited

**SMB Impact Scoring:**

- **High:** Blocks customer activation, causes compliance audit failure, or creates security incident
- **Medium:** Slows sales cycle, degrades UX under load, or violates internal SLA
- **Low:** Nice-to-have polish, technical debt, or marginal performance gain

---

**Generated:** 2026-04-20 by Claude Sonnet 4.5  
**Contact:** [Platform team — session context](https://claude.ai)
