# AtlasIT Roadmap

**Last updated:** 2026-04-13 · **Single source of truth** (absorbs former `AWS-MIGRATION-STATUS.md`)

---

## Vision & Positioning

AtlasIT is an **IT automation and compliance platform** for small and mid-sized businesses (1–1000 employees) that want to internalize IT ops securely without dedicated IT teams or expensive MSPs.

**Value prop:** Zero-touch IT operations — once adapters are connected and rules are defined, the platform runs itself. Compliance is a byproduct of the operations, not a separate tool.

**Differentiators:**

- Cloud-native on AWS Lambda + Aurora PostgreSQL + S3 + CloudFront
- 35 pre-built adapters (Okta, M365, Google Workspace, GitHub, Slack, Jira, AWS, Azure, GCP, …)
- Evidence is _operation-generated_, not checkbox-driven — provably more credible trust center output
- MCP agent bus for AI-driven remediation and shadow-AI detection
- Policy-as-code compliance across SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR

**The autonomous loop:**

```
Directory Event / Schedule / Webhook
  ↓ AutomationDO (dedup + rate-limit + conditions)
  ↓ Step Functions (durable workflow: JML or automation rule)
  ↓ Adapter calls (provision / revoke / sync across 35 apps)
  ↓ Evidence emitted → compliance-api scores
  ↓ Score change → publishEvent() → rules re-evaluate
```

---

## Strategic Platform Expansion (2026)

AtlasIT strategic scope now explicitly spans five platform pillars:

- Identity Lifecycle (JML)
- Compliance Digital Twin (CDT)
- Security Orchestration
- Vendor Assurance / Third-Party Risk (TPRM)
- Exposure Management / Threat Scanning

### Expansion Phasing (acquisition-oriented)

This delivery track is framed for strategic adjacency attractive to ServiceNow, CrowdStrike, Okta, Vanta, and Drata.

**Phase 1**

- Vendor inventory
- Trust Center MVP
- Exposure Lite scanner
- Customer-facing demo flows

**Phase 2**

- AI questionnaire response generation
- Continuous external monitoring
- Vendor reassessment automation
- Risk scoring engine

**Phase 3**

- Autonomous remediation
- Dependency-aware compliance simulation
- MSSP multi-tenant federation

### Patentability Additions

- Mapping third-party evidence into live compliance state
- Automated trust center evidence lineage
- Exposure findings mutating compliance posture
- Autonomous remediation tied to evidence graph

### Competitive Adjacency

AtlasIT now directly competes or overlaps with Vanta, Drata, SafeBase, OneTrust, Tenable, Rapid7, and CrowdStrike EASM, while differentiating on unified automation + evidence graph architecture.

---

## Status at a glance (2026-04-13)

| Area                 | State                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Infrastructure       | AWS-native, post-migration stability window active until 2026-04-25                       |
| Cost (AtlasIT only)  | ~$14/mo (RDS $3.48, Route 53 $4, NAT $3, WAF $1.78, CloudWatch $0.50, rest ~$1)           |
| Lambda functions     | 17 (9 adapters + 7 core + 1 utility: migration-runner)                                    |
| Tenants              | 10 (1 real: atlasit; 9 test/QA)                                                           |
| Active users         | 12                                                                                        |
| Events pipeline      | Wired (10 business actions publish events; compliance scoring delta-gated)                |
| Phase 9 Trust Center | **6/8 shipped** — remaining: NDA workflow, Questionnaire AI Lambda port                   |
| Stub endpoints       | **2** (only `/api/health` sentinel + `/api/marketplace/installs` derivable; down from 20) |

---

## Shipped

All items below have been merged to `main` and deployed. Session 3 (2026-04-13) work is pulled to the top for visibility.

### Session 3 highlights (2026-04-13 — PRs #446-459)

- **AWS orphan cleanup** — deleted 9 CF-era Lambdas + 10 IAM roles + 14 policies + 17 log groups + 1 Lambda layer + orphan VPC (cascade) + 2 API Gateways (HTTP + WebSocket) + 2 CloudFront distros + 1 RDS snapshot + 3 DynamoDB tables + 2 S3 buckets. Prod `atlasit.pro` untouched. **Cost dropped ~$26/mo → ~$14/mo.**
- **Terraform hygiene** — 30-day log retention on 9 adapter log groups (for_each + imports), S3 lifecycle rules (policies/artifacts/console), scoped IAM perms for `atlasit-dev-cli`, Lambda version prune in CI (keep last 5).
- **20+ stub endpoints wired** — Tier 1 (apps/marketplace/observability), Tier 2 (MFA with inline TOTP, SSO, directory mappings, support, DSAR, compliance anomalies + migration 0057), Tier 3 (Stripe billing + migrations 0058+0059). stubMap reduced 20 → 2.
- **P0 silent production bug fixes** — compliance-api + orchestrator crashed on every EventBridge scheduler tick (caught + swallowed → CW errors=0 while core features broke). Scheduler aggregator lied about success. onboarding-api was 100% broken (every route 404). Fixed.
- **Phase 9.1: PDF auditor export** — `GET /api/v1/trust/:slug/export.pdf` with framework scoping + optional per-control detail + SHA-256 content hash per page for tamper detection. Pure `pdf-lib`, no Puppeteer.
- **CI cleanup** — removed 14 dead CF deploy jobs (workflow 760 → 244 lines). Replaced legacy D1 migration step with PG Lambda runner. **Cloudflare is no longer a deploy target.**
- **Events pipeline wired** — `publishEvent()` helper in core-api, onboarding-api, compliance-api. 10 business actions now publish (user.{invited, activated, created}, tenant.created, integration.{connected, disconnected, tested}, mfa.{enabled, disabled}, compliance.score_evaluated).
- **UUIDs/slug hygiene** — migration 0060 adds `slug <> ''` CHECK + UNIQUE index; signup now generates UUID for `tenants.id`.

### Platform foundation (Phases 0–6 — all shipped)

- CF Workers era: Workflow durability, Auth hardening, MCP orchestration, 35-app marketplace scaffold, Production hardening (Okta SCIM, k6, OPA drift detection, rate limiting, security headers), RBAC expansion to 27 routes, BFF normalization (snake_case → camelCase).
- `packages/shared` with Zod types, auth middleware, platform adapters, observability (logger, metrics, tracer).

### Phase 7 — Compliance-as-Automation (shipped except policy eval stub)

- 60 CDT rules (SOC 2, ISO 27001, HIPAA, NIST CSF, GDPR)
- Evidence classifier maps 30+ event types → compliance controls
- JML engine auto-emits tamper-evident evidence on every joiner/mover/leaver
- Adapter evidence endpoints for 6 adapters (GitHub, Okta, Google Workspace, M365, AWS, Slack)
- **Open:** `evaluatePolicy()` is a stub — see Next Up.

### Phase 7.5 — Scoring Unification (shipped)

- Evidence-grounded scores write to `compliance_scores` + `compliance_history`
- `parseControlRef()` utility handles multi-segment prefixes (ISO-27001, NIST-CSF)
- Adapter pass/fail wired into scoring — failing evidence caps controls at `in_progress`
- Daily comprehensive re-evaluation cron `0 2 * * *`
- CDT twin evaluates all 60 rules; bridges state to `compliance_evidence`
- Remediation catalog expanded 2 → 37 controls

### Phase 8 — Access Reviews (shipped)

- Campaign creation with scope (all apps / specific / departments)
- Manager-facing approve/revoke UI
- Auto-revoke on campaign expiry (cron Duty 1)
- Evidence generation per review cycle flows through pipeline to compliance scoring

### Phase 8.5 — AWS Migration (shipped — M1-M7 all complete)

Full re-host from Cloudflare Workers/D1/KV/R2/Queues to AWS Lambda/Aurora PG/DynamoDB/S3/SQS.

- 18 Terraform files in `infra/aws/`, Aurora Serverless v2, 7 core Lambdas, 9 adapter Lambdas
- Step Functions: JML workflow + automation rule state machines
- CloudFront + WAF (3 managed + 2 rate-limit rules) + ACM wildcard
- EventBridge Scheduler replaces cron triggers
- NAT instance (t4g.nano) replaces managed NAT Gateway — saves $29/mo
- Data migrated: 23 D1 tables → PG (1,151 rows), KV → DynamoDB, R2 → S3
- DNS cutover complete — `www.atlasit.pro` + `atlasit.pro` serve from CloudFront
- Security: `x-tenant-id` now requires `INTERNAL_API_KEY` for service-to-service auth; 7 unscoped SQL queries fixed
- Migration gate **PASSED** 2026-04-12. 2-week stability monitoring runs 2026-04-11 → 2026-04-25.

### Phase 9 — Trust Center (6/8 shipped)

- [x] Public route `/trust/{tenantSlug}` — live at https://www.atlasit.pro/trust/atlasit
- [x] Framework scores, evidence recency, connected integrations count (privacy-preserving)
- [x] Tenant visibility controls — `tenants.config.trust_center_public` toggle, admin UI at `/console/settings/trust`
- [x] Embeddable badge — `/api/v1/trust/:slug/badge.svg` (shields.io-style) + `/trust/[slug]/embed` iframe
- [x] **Auditor PDF export (Phase 9.1)** — `GET /api/v1/trust/:slug/export.pdf` with optional framework scoping + control detail + SHA-256 content hash footer for tamper detection
- [x] Questionnaire AI skeleton exists at `console-app/src/lib/server/questionnaire-ai.ts` (keyword → control mapping + Groq response generation). **Not yet Lambda-wired — see Next Up.**

---

## In Progress

Nothing active — post-session-3 is a clean baseline.

---

## Next Up (ranked)

Each item is bounded, has no external blockers, and ships in <3 days of focused work.

1. **Questionnaire AI Lambda port (Phase 9 finish — ~3 days)**  
   Port `console-app/src/lib/server/questionnaire-ai.ts` to `lambdas/compliance-api/`. Currently uses D1-style `db.prepare().bind()` that doesn't work in SPA mode. Replace with `pg` pool queries against `compliance_evidence`. Add `questionnaire_responses` table (migration 0061). Wire Groq API key via SSM + Lambda env var. New endpoints: `POST /api/v1/trust/questionnaire/parse`, `POST /api/v1/trust/questionnaire/generate`, `POST /api/v1/trust/questionnaire/feedback`.

2. **NDA workflow (Phase 9 finish — ~2 days)**  
   New `trust_access_requests` table + email notification + signed time-limited access token. Visitor fills a form on `/trust/:slug` → tenant admin approves in console → visitor gets signed URL to detailed evidence bundle. Reuse the `/export.pdf` route with a signed scope parameter.

3. **NHI Inventory Dashboard (Phase 10 priority alpha — ~2 days)**  
   Extend directory schema with `identity_type: human | service | bot | api_key | oauth_grant`. Surface service accounts (AWS IAM), API tokens (GitHub), OAuth apps (Google Workspace, M365). Read from existing adapter evidence — data is already flowing in. New UI page `/console/directory/nhi`.

4. **Adapter binding hardening (M7.2 finish — ~1 day)**  
   Okta + AWS adapters gracefully degrade but reference missing CF-era bindings in their code paths. Clean up and move config to Lambda env vars. Flagged in M7.2.

5. **compliance-api runtime errors log-metric filter (~30 min)**  
   Our P0 pass found CloudWatch Errors metric unreliable because Lambda catches and returns 500 bodies. Add a CW Logs metric filter on `ERROR|Unhandled|TypeError` strings with an alarm — otherwise the same class of silent failure can hide again.

6. **Events consumer validation (~2 hr)**  
   Now that 10 business actions publish events, verify the orchestrator SQS consumer actually processes them end-to-end. Walk one event from publish → SQS → processor → events.status='processed'. Fix whatever's broken.

7. **Stripe price IDs + live billing test (~1 hr + user action)**  
   Tier 3 billing endpoints ship with graceful 501 when `STRIPE_API_KEY` unset. To go live: create 6 Stripe prices (starter × {monthly, annual}, professional × {m,a}, enterprise × {m,a}), store as SSM params, set `STRIPE_API_KEY`. End-to-end test with a test card.

---

## Later (Phases 10–17)

Strategic items scoped but not started. Priorities in ranked order above; these are the longer runway.

### Phase 10 — Non-Human Identity Governance

OWASP Top 10 NHI Risks (2025) lists "improper offboarding" as #1 — exactly what AtlasIT's JML engine handles for humans. ConductorOne raised $79M and Astrix raised $45M specifically for NHI governance.

- Token expiry tracking + auto-rotation workflows
- NHI access reviews — extend Phase 8 campaigns to cover service accounts and API keys
- NHI offboarding in JML leaver workflows — revoke service accounts, rotate shared secrets, disable OAuth grants
- Compliance evidence auto-generation for NHI lifecycle (SOC2 CC6.1/CC6.3, ISO27001 A.9.2.6, HIPAA 164.312(d))

### Phase 11 — Shadow AI & SaaS Discovery

Shadow AI has overtaken traditional shadow IT as the #1 visibility risk. 75% of employees expected to acquire tech without IT oversight by 2027 (Gartner).

- OAuth grant analysis from Google Workspace + M365 admin APIs
- Shadow AI detection — unapproved LLM OAuth grants, MCP server connections, browser extension data flows
- Risk tier dashboard (approved / under review / blocked / unknown)
- Governance playbooks — auto-respond: notify, block, create access review

### Phase 12 — AI-Driven Compliance Intelligence

- Compliance gap analyzer — continuously identify stale/missing evidence + recommend specific adapter connections
- Risk anomaly detection — bulk privilege escalation, off-hours provisioning, SoD violations
- AI policy generator — auto-generate policies from control frameworks + tenant's actual config
- NL automation builder enhancement (`packages/shared/src/automation/nl-builder.ts` partial)
- Compliance drift alerting — proactive notifications when operational change causes regression

### Phase 13–15 — Platform Polish

- **Directory Reality** — replace synthetic directory sync with real provider sync; group→app mapping based on real data
- **OAuth Hardening** — actionable error UX; credential encryption enforcement (remove silent plaintext fallback)
- **Workflow Trust** — idempotency surfacing, DLQ visibility in UI, confidence threshold surfacing in automation engine

### Phase 16 — Continuous Validation

- Scheduled synthetic crawl + a11y budgets (Playwright + axe, WCAG 2.2)
- k6 smoke SLO gates (LCP ≤ 2.5s, INP ≤ 200ms at p75)
- Security scanning: Snyk + ZAP baseline
- Platform Status truthfulness SLO (functional checks, not just reachability)

### Phase 17 — Market Readiness & PLG Entry

The compliance market is overwhelmingly sales-led with opaque pricing. 187 G2 complaints about Vanta cite inflexible contracts. First vendor to offer self-serve + transparent pricing captures frustrated mid-market buyers.

- Transparent self-serve pricing tiers
- Free tier — SaaS discovery + compliance assessment (PLG funnel)
- Usage metering + Stripe billing (infrastructure already in place from Tier 3)
- Plugin API for third-party compliance packs

---

## Deferred / Parked

Items we've explicitly chosen not to work on right now.

- **Rego policy evaluation** — Phase 7 P3. `evaluatePolicy()` stub hashes input and returns it. No real policy logic runs. Low customer demand relative to evidence-based scoring; park until a customer asks.
- **CF decommission finalization** — M6.3. 2-week stability window ends 2026-04-25. Don't delete CF Workers/D1/KV/R2/Queues until stability confirmed. Tracking in memory.
- **RDS Proxy TLS tuning** — Proxy is provisioned (`atlasit-rds-proxy-dev`) but Lambda connection via proxy returns "Connection terminated unexpectedly". Reverted to direct RDS. ~45s cold start timeout on write ops remains. Fix when cold starts become customer-blocking.
- **NAT instance EIP allocation** — NAT instance uses auto-assigned public IP (brittle; survives reboot but not stop/start). Allocating an EIP (+$3.60/mo) would stabilize the IP for customer security allowlists. Defer until a customer requires allowlist.
- **Legacy tenant ID migration** — 8 tenants have slug-style IDs (atlasit, test, …) from pre-signup era; 2 new ones have UUIDs. Zero FK orphans — not broken. Going forward all new tenants get UUIDs (signup flow updated). Don't migrate the 8 legacy ones; touching 30+ tables of `tenant_id` references is too risky for non-bug cleanup.
- **Legacy `terraform/aws/` stack** — `atlasit-tflock` DDB + `atlasit-tfstate-*` S3 bucket still exist; legacy `backend.tf` references them. Archive decision needed before deletion.
- **Adapter Lambda code** — 7 of 9 adapter Lambdas have zero invocations in 24h. Deployed and billed but no real tenant has connected anything except github (1 integration). Natural cleanup: as customers connect, the adapter traffic materializes.

---

## Migration Record (2026-04-09 → 2026-04-13)

Preserved so future sessions know what happened. Not a task list.

| Phase | What                                   | Shipped                         |
| ----- | -------------------------------------- | ------------------------------- |
| M1    | Route completion (parity with CF)      | 2026-04-11                      |
| M2    | Infrastructure convergence (Terraform) | 2026-04-10                      |
| M3    | Data migration (D1 → RDS: 1,151 rows)  | 2026-04-11                      |
| M4    | Integration testing + QA               | 2026-04-11                      |
| M5    | DNS cutover (CloudFront + Route 53)    | 2026-04-11                      |
| M6    | Adapter migration (7/9 adapters live)  | 2026-04-11                      |
| M7.1  | Stability monitoring (2-week window)   | runs through 2026-04-25         |
| M7.2  | Comprehensive QA (this session)        | 2026-04-13 (P0s caught + fixed) |
| M7.3  | Roadmap re-evaluation + consolidation  | 2026-04-13 (this document)      |

Migration gate PASSED 2026-04-12. Platform Phase 9 work commenced same day. Session 3 (2026-04-13) found + fixed P0 silent failures (handler crashes), delivered Phase 9.1 PDF export, wired the events pipeline, and archived the separate migration status doc.

---

## Cross-Cutting Concerns

| Concern             | Strategy                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Schema evolution    | Versioned PostgreSQL migrations in `migrations/`. Applied via `atlasit-migration-runner` Lambda from CI on PR merge.                |
| Secrets             | AWS Secrets Manager + SSM Parameter Store + Lambda env vars                                                                         |
| Config              | Terraform-managed for infra; `DATABASE_URL` set manually via CLI (ignore_changes on Lambda env)                                     |
| Performance         | DynamoDB + CloudFront caching; SQS for async dispatch                                                                               |
| Testing             | Vitest (unit), Miniflare (remaining CF-era tests), Puppeteer (console E2E)                                                          |
| Observability       | CloudWatch Logs (30d retention), 3 alarms (5xx, Lambda errors, Lambda duration). **Next: log-metric filter for silent-500 errors.** |
| IaC                 | Terraform in `infra/aws/` (26 files). Legacy `terraform/aws/` stack is frozen.                                                      |
| Events pipeline     | `publishEvent()` helper in Lambdas writes row + SQS step-task. Orchestrator SQS consumer processes to completion.                   |
| Usability contracts | DTO mapping (snake_case → camelCase); BFF error normalization                                                                       |

---

## Target Market & Competitive Positioning

| Segment                           | Profile                                                                  | Why AtlasIT wins                                                                |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Mid-market (100–1000)**         | Outgrown JumpCloud, can't justify $50K+ for Vanta on top of IT ops spend | One platform at half the cost of two specialized tools                          |
| **Compliance-first SMB (10–100)** | B2B SaaS needing SOC 2 to close enterprise deals                         | Fastest time-to-compliance: connect adapters → evidence generated automatically |
| **Security-conscious scaleup**    | Engineering-heavy, 200–500 employees, multi-cloud                        | NHI governance + shadow AI detection in same platform that provisions access    |

```
┌─────────────────────────────────────────────────────────────┐
│                    AtlasIT Platform                         │
│                                                             │
│  IT Ops ←──────────→ Compliance ←──────────→ Governance     │
│  (JML, provision,    (evidence as a         (access reviews,│
│   35 adapters,        byproduct of ops,      NHI lifecycle, │
│   workflows)          5 frameworks,          shadow AI)      │
│                       trust center)                          │
│                                                             │
│  "Your IT operations ARE your compliance evidence"          │
└─────────────────────────────────────────────────────────────┘

Competitors must stitch together:
  Rippling/JumpCloud + Vanta/Drata + ConductorOne/Lumos + Nudge Security
  = 4 vendors, 4 integrations, 4 bills, zero data coherence
```

**Modular product line (long-term):**

- **AtlasIT – IT Ops**: JML automation, provisioning, access requests, SSO — replaces JumpCloud/Rippling IT layer
- **AtlasIT – Compliance**: Evidence locker, continuous scoring, trust center, questionnaire AI — replaces Vanta/Drata
- **AtlasIT – Identity**: Human + non-human identity governance, access reviews, SoD — replaces ConductorOne/Lumos
- **AtlasIT – Discovery**: Shadow AI/SaaS detection, OAuth grant analysis — replaces Nudge Security/Torii
- **AtlasIT – Extensions**: Custom connectors + plugin API

---

## Archived

- `AWS-MIGRATION-STATUS.md` (deleted 2026-04-13) — migration is complete; key milestones absorbed into "Migration Record" above.
- Phase 13–17 "(Previously Phase X)" section headers in the old roadmap — consolidated into Later (above) without the rename history.
