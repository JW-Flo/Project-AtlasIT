# AtlasIT Roadmap

**Last updated:** March 2026

This roadmap tracks implementation phases from foundation through market readiness. See `STATUS.md` for current deployment state and `CLAUDE.md` for coding standards.

---

## Vision & Market Positioning

AtlasIT is a **Cloudflare-native IT automation and compliance platform** for small and mid-sized businesses (1–100 employees) that want to internalize IT ops securely without dedicated IT teams or expensive MSPs.

**Value prop:** Zero-touch IT operations — once adapters are connected and rules are defined, the platform runs itself.

**Differentiators:** Edge-native architecture, AI-driven connector onboarding, policy-as-code compliance, unified IdP abstraction with fallback OIDC/SAML for SMBs without an existing identity provider.

### The Autonomous Loop

```
Directory Event / Schedule / Webhook
  ↓ AutomationDO (dedup + rate-limit + conditions)
  ↓ WorkflowDO (durable steps, retry, compensation)
  ↓ Adapter calls (provision / revoke / sync across 35 apps)
  ↓ Evidence emitted → compliance-worker scores
  ↓ Score change → new event → rules re-evaluate
```

### No-Brainer Backend Automations

| Scenario                    | Trigger                              | What Happens Automatically                                                              |
| --------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| **New hire onboarding**     | `user.created` from Okta/M365/Google | Provision GitHub, Jira, Slack, email + all role-assigned apps; notify manager on Slack  |
| **Employee offboarding**    | `user.deactivated`                   | Revoke access across all connected apps; emit offboarding evidence; create audit record |
| **Department transfer**     | `group.membership_changed`           | Update app entitlements, reassign RBAC roles, re-sync directory                         |
| **App connected**           | `app_connected`                      | Auto-provision existing users that match group rules; start health checks               |
| **Compliance scan**         | Cron schedule                        | Collect evidence from connected tools, re-score controls, create incidents on failures  |
| **Policy violation**        | `compliance_score_changed`           | Auto-create incident, notify ops via Slack, trigger remediation workflow                |
| **Access request approved** | Workflow gate cleared                | Provision app access within seconds, no manual ops steps                                |

### Components That Make It Real

- **AutomationDO** — per-tenant rule engine; 9 trigger types, 8 action types, 5-min dedup TTL
- **WorkflowDO** — durable joiner/mover/leaver with per-step timeouts and DLQ-backed compensation
- **35 adapters** — Okta, Google Workspace, M365, Slack, GitHub, Jira, Confluence, Stripe, AWS, Azure, GCP, Salesforce, HubSpot, and 22 more
- **MCP agent bus** — HMAC-verified agent webhooks; Slack notifier live, extensible to PagerDuty, email, Jira
- **compliance-worker** — Evidence-grounded scoring across 5 frameworks, R2 evidence storage, adapter evidence collection

> Everything in the phases below is infrastructure to make these automations reliable, observable, and trustworthy.

---

## Phase 0 — Foundation ✅

- Cloudflare Workers deployed (onboarding, orchestrator, docs)
- D1 schemas (13 root + 8 worker migrations)
- Shared types package with Zod schemas
- Vitest + Miniflare test harness
- Structured logging, error handling middleware
- `packages/shared` with auth, middleware, platform adapters

## Phase 1 — Workflow Durability + Auth Hardening ✅ (PR #139)

- Unified workflow types (shared RunState/StepState)
- EvidenceEmitter wired into WorkflowDO (R2-backed)
- Queue dispatch via QueueBus (Cloudflare Queues)
- Dead letter queue integration (DLQ + replay)
- D1-backed RBAC (console_user_roles table, unknown users → viewer)
- Shared auth middleware enforced on core-api and ai-orchestrator
- Dev bypass validation script

## Phase 2 — MCP Orchestration ✅ (PR #140)

- Compensation dispatch (queued via QueueBus, not instant)
- Per-step timeout tracking with stepDeadline
- Compensation failure escalation to DLQ
- Slack notification MCP agent (event → Slack webhook)
- Inbound HMAC signature verification on event ingestion
- E2E orchestration integration tests (event → agent → workflow)

## Phase 3 — Marketplace & Integrations ✅ (Pre-existing)

- Marketplace API (GET /apps, POST /install, DELETE /uninstall)
- Connector schema package with Zod validation
- Adapter generator pipeline (research → scaffold → compile)
- Google Workspace connector (OAuth 2.0, user/group sync)
- Okta connector (directory sync + webhook events)
- Marketplace UI (SvelteKit: catalog, install, configure)
- Credential vault (AES-GCM envelope encryption)
- Feature flag system (KV-backed, rollout %, tenant overrides, kill switches)
- E2E connector install flow test

## Phase 4 — Hardening & Production ✅ (PR #141)

- Okta SCIM 2.0 provisioning endpoints (Users + Groups CRUD, filter parsing)
- k6 load testing scripts (smoke/load/stress/soak for 3 services)
- IaC drift detection (OPA/Conftest policies, GH Actions workflow)
- OIDC exchange worker hardened (GitHub JWT validation, rate limiting, repo allowlists)
- CF Workers-native observability (W3C traceparent tracer, Analytics Engine metrics)
- Rate limiting middleware (KV-backed, per-endpoint)
- Security headers middleware (CSP, HSTS, X-Frame-Options)

## Phase 5 — Adapter Scaffolding ✅ (PR #158, #159, #163, #166)

- [x] Registry data for all 35 apps (`shared/integrations/registry-detailed.ts`)
- [x] ConnectorManifest templates for all apps (`packages/connector-schema/src/templates.ts`, 2300+ lines)
- [x] Scaffold all adapters via `adapter-gen` into `adapters/<slug>/` (PR #158)
- [x] Implement 21 SaaS adapters with directory sync, webhooks, and auth (PR #159)
- [x] Hand-write core-tier implementations (9 apps): Microsoft 365, Slack, Jira, GitHub, Stripe, AWS, Azure, + Okta, Google Workspace (production)
- [x] Update `adapters/registry.json` with all 35 entries
- [x] Add adapter deploy jobs to CI/CD (`deploy-on-merge.yml` — dynamic matrix)
- [x] Expand adapter catalog from 24 → 35 apps (added Salesforce, HubSpot, Dropbox, Notion, Zendesk, Asana, Monday, DocuSign, Figma, Canva, Zscaler)
- [x] Update console-app integration statuses to match registry (planned → alpha/beta) — PR #163
- [x] Seed marketplace DB with all 33 apps — PR #163
- [x] Add missing JML workflow YAMLs — PR #163
- [x] Add Zscaler Zero Trust adapter (ZIA + ZPA + ZIdentity, OAuth2) — PR #166

## Phase 6 — Contract Stability & Auth Hardening ✅

- [x] Expand RBAC permission matrix — 27 mutation routes guarded (PR #164)
- [x] Standardize DTO mapping (snake_case → camelCase) across all BFF proxy routes (PR #165)
- [x] Normalize error handling: `safeProxyFetch` wrapper with standard error shape (code, message, correlationId)
- [x] Startup-failing assertions for missing prod secrets (slack-agent, dispatch-worker, onboarding)
- [x] CF Access JWT signing key rotation readiness (dynamic JWKS fetch + rotation event logging)
- [x] Slack webhook verification alignment (HMAC-SHA256, 5-min replay window, correlationId on failures)

## Phase 7 — Compliance-as-Automation (Unique Moat) ⚠️ Partially Complete

> **Strategic context**: No competitor combines IT lifecycle automation + compliance evidence collection.
> Vanta/Drata collect evidence passively; AtlasIT creates evidence actively through operations.
> Every JML workflow step should auto-emit tamper-evident compliance artifacts — making compliance
> a byproduct of running IT operations, not a separate tool.

### Completed

- [x] Expand CDT rules from 7 → 60 (SOC 2, ISO 27001, HIPAA, NIST CSF, GDPR Article 5 coverage)
- [x] Map 9 automation action types to 40+ compliance control keys (`packages/shared/src/automation/compliance-mapping.ts`)
- [x] Evidence classifier maps 30+ event types to compliance controls (`packages/shared/src/evidence/classifier.ts`)
- [x] Evidence locker writes to R2 (content-addressed) + D1 (`compliance_evidence`) (`packages/shared/src/evidence/locker.ts`)
- [x] CDT evaluate endpoint computes evidence-grounded scores per framework (`compliance-worker GET /api/v1/cdt/evaluate`)
- [x] JML engine auto-emits tamper-evident evidence on every joiner/mover/leaver classification
- [x] Enforce leaver grace period via WorkflowDO alarm-based delay (leaverGraceMs)
- [x] Generate mover/leaver workflows for all 19 adapters (full JML coverage)
- [x] GDPR Article 5 formal control definitions in CDT rules (7 rules: Art.5(1)(a)-(f) + Art.5(2))
- [x] Manual evidence upload UI with SHA-256 hashing, pack types, and control linking
- [x] Adapter evidence endpoints for 6 adapters (GitHub, Okta, Google Workspace, M365, AWS, Slack)
- [x] `POST /api/v1/evidence/collect` pulls evidence from connected adapters via `ADAPTER_URLS`
- [x] CDT twin Worker with mTLS + HMAC auth, idempotency, remediation queue
- [x] Files: `shared/services/cdt/rules/`, `compliance-worker/src/modules/policies/`, `ai-orchestrator/src/lib/jml-engine.ts`, `packages/shared/src/evidence/`, `adapters/*/src/index.ts`

### Integration Gaps (resolved in Phase 7.5)

- [x] **Scoring paths unified** — Console `/api/tenant-compliance/scores` now reads evidence-grounded scores from compliance-worker CDT evaluate endpoint, falling back to cached scores
- [x] **`storeEvidence()` already wired** — orchestrator event consumer (`ai-orchestrator/src/routes/events.ts`) classifies and stores every event via `waitUntil`
- [x] **CDT twin now evaluates all 60 rules** — replaced hardcoded 7-control subset with `ALL_CONTROL_IDS` export
- [x] **Scheduled evidence collection** — orchestrator cron (Duty 2) collects adapter evidence for all tenants every 5 minutes
- [x] **CDT twin state bridged to D1** — state transitions now write to `compliance_evidence` via `ATLAS_SHARED_DB`, making twin results visible to the scoring pipeline
- [ ] **Policy evaluation is a stub** — `evaluatePolicy()` hashes the input and returns it; no Rego or Boolean policy logic runs

## Phase 7.5 — Compliance Integration (Close the Loop) ⚠️ In Progress

> **Why this matters**: All compliance building blocks exist but were disconnected. Closing these gaps
> turns the compliance system from a demo into a differentiator.

### P0 — Unify Scoring (UI shows real evidence-grounded scores) ✅

- [x] Console `/api/tenant-compliance/scores` reads from `compliance_evidence` (via compliance-worker CDT evaluate) instead of `tenant_preferences.compliance_controls`
- [x] Evidence-grounded scores write to `compliance_scores` + `compliance_history` tables (same as today)
- [x] `tenant_preferences.compliance_controls` deprecated as score source; UI now shows evidence-grounded scores with `source: "evidence"` indicator

### P1 — Wire Evidence Pipeline End-to-End ✅

- [x] Orchestrator event consumer already calls `classifyEvent()` + `storeEvidence()` for every event (was wired in `events.ts`, not a gap)
- [x] Adapter evidence collection runs on orchestrator cron schedule (Duty 2, every 5 minutes, all tenants)
- [x] Evidence from adapters and events appears in `compliance_evidence` → feeds CDT evaluate scoring → feeds UI
- [x] **Fixed control-ref parsing bug** — `parseControlRef()` utility correctly maps multi-segment prefixes (ISO-27001, NIST-CSF) instead of naïve `indexOf("-")` split that silently dropped ISO/NIST evidence
- [x] **Adapter pass/fail wired into scoring** — controls with failing adapter evidence (e.g. MFA not enforced) are now capped at `in_progress` rather than promoted by evidence recency alone
- [x] **Score recalculation after evidence collection** — orchestrator cron now triggers compliance-worker CDT evaluate for all tenants after evidence is collected (Duty 3)
- [x] **Daily comprehensive re-evaluation** — added `0 2 * * *` cron for full cross-framework scoring refresh
- [x] **Evidence coverage indicators in UI** — controls tab now shows per-control evidence count badges, aggregate coverage summary, and "Gap" indicators

### P2 — Expand CDT Twin Coverage ✅

- [x] CDT twin `/twin/event` evaluates all 60 rules (exported `ALL_CONTROL_IDS` from engine, replaced hardcoded list)
- [x] Bridge CDT twin KV state to `compliance_evidence` D1 — state transitions now write a row via `ATLAS_SHARED_DB` binding
- [x] Expand remediation catalog from 2 → 37 controls across all 5 frameworks (16 distinct action types)

### P3 — Policy Evaluation ✅

- [x] Replace stub `evaluatePolicy()` with real policy logic (Boolean allow/deny decisions)
- [x] Wire policy evaluation into compliance scoring (policy pass/fail → control status)
- [x] Bulk policy evaluation endpoint (`POST /api/v1/policies/evaluate-all`) stores results as `policy_evaluation` evidence
- [x] Scoring engine queries policy eval evidence alongside adapter evidence; policy fail caps control at `in_progress`
- [x] Orchestrator cron triggers bulk policy evaluation (Duty 2.5) before score recalculation

### Files Changed

- `console-app/src/routes/api/tenant-compliance/scores/+server.ts` — unified scoring via compliance-worker
- `console-app/src/routes/api/tenant-compliance/controls/+server.ts` — added evidence counts per control
- `console-app/src/routes/console/compliance/+page.svelte` — evidence coverage indicators in controls tab
- `ai-orchestrator/src/index.ts` — Duty 2: scheduled adapter evidence collection; Duty 3: score recalculation trigger; daily cron logic
- `ai-orchestrator/wrangler.toml` — added daily cron `0 2 * * *`, `COMPLIANCE_WORKER_URL` binding
- `compliance-worker/src/modules/policies/cdt-rules.ts` — adapter pass/fail status affects scoring
- `packages/shared/src/evidence/adapter-collector.ts` — `parseControlRef()` utility for control ref parsing
- `shared/services/cdt/src/evaluation/engine.ts` — exported `ALL_CONTROL_IDS` (60 controls)
- `shared/services/cdt/src/index.ts` — twin evaluates all 60 rules + bridges state changes to D1
- `shared/services/cdt/src/remediation/catalog.ts` — expanded from 2 to 37 control-to-action mappings
- `shared/services/cdt/wrangler.toml` — added `ATLAS_SHARED_DB` D1 binding

## Phase 8 — Access Reviews (Table Stakes for IGA) ✅

> Required for SOC 2 CC6.1/CC6.3 and ISO 27001 A.9.2.5. Lumos, Zluri, ConductorOne all have this.

- [x] Campaign creation (scope: all apps / specific apps / departments) — `console-app/src/lib/server/access-reviews.ts`
- [x] Manager-facing review UI — approve/revoke per user/app — `console-app/src/routes/api/access-reviews/`
- [x] Auto-revoke on campaign expiry (configurable grace period) — `ai-orchestrator/src/lib/access-review-auto-revoke.ts`, runs in cron Duty 1
- [x] Evidence generation per review cycle — decisions emit `access_review.completed` events to orchestrator; auto-revoke emits via `classifyEvent` + `storeEvidence`; both flow through evidence pipeline to `compliance_evidence` → scoring
- [x] D1 tables: `access_review_campaigns`, `access_review_items`, `access_review_decisions` — migration `0021_access_reviews.sql`
- [x] Automation action type `request_access_review` with compliance control mappings (SOC2 CC6.1, CC6.3, ISO27001 A.9.2.5, HIPAA 164.312(a)(1))
- [x] Files: `console-app/src/routes/api/access-reviews/`, `ai-orchestrator/src/lib/access-review-auto-revoke.ts`, `migrations/0021_access_reviews.sql`

## Phase 9 — Trust Center & Questionnaire Automation (Kill the Security Questionnaire)

> **Strategic context**: 43% of companies report compliance gaps delayed their sales cycles (Secureframe 2026).
> Vanta and Drata offer trust centers as paid add-ons ($5K-$15K extra). AtlasIT's advantage: our evidence
> is operation-generated, not checkbox-driven — making trust reports provably more credible.
>
> **Competitive intel**: Trust centers are now table stakes for B2B sales. The differentiator is using
> trust center content to auto-respond to security questionnaires — the #1 bottleneck in enterprise deals.
> TrustCloud and SafeBase lead here, but neither connects to real IT operations data.

- [x] Public route `/trust/{tenantSlug}` — live compliance scores, framework coverage, evidence recency, connected integrations count (pre-existing, extended)
- [x] Evidence provenance trail — per-control evidence items showing source, operation type, timestamp, freshness indicator, pass/fail status
- [x] Tenant visibility controls — granular per-framework and per-control privacy settings (public / NDA-gated / private)
- [x] Self-service NDA workflow — visitors request access, tenant approves/denies, time-limited access tokens (7-day TTL)
- [x] CSV/JSON auditor package export — per-framework evidence bundle with SHA-256 content hash for tamper detection
- [x] Security questionnaire AI — parse SIG/CAIQ/custom templates, keyword-based control mapping, Groq-backed response generation grounded in evidence
- [x] Embeddable trust badge — SVG badge endpoint with grade/score, JSON format option, 5-minute cache
- [x] D1 migration: `trust_access_requests`, `questionnaires`, `questionnaire_responses` tables
- [x] Files: `console-app/src/routes/trust/`, `console-app/src/routes/api/trust/`, `console-app/src/lib/server/questionnaire-ai.ts`, `console-app/src/routes/api/questionnaires/`

## Phase 10 — Non-Human Identity Governance (Hottest IGA Category)

> **Strategic context**: NHIs outnumber human identities 10:1+. ConductorOne raised $79M (Oct 2025)
> specifically for NHI governance. Astrix raised $45M (backed by Anthropic's fund) for NHI security.
> OWASP Top 10 NHI Risks (2025) lists "improper offboarding" as #1 — exactly what AtlasIT's JML
> engine already handles for humans.
>
> **AtlasIT's advantage**: Our 35 adapters already touch service accounts, API keys, OAuth tokens, and
> bot credentials during provisioning. Extending directory sync to surface these is incremental, not greenfield.
> No competitor connects NHI governance to compliance evidence generation.

- [ ] Extend directory schema: `identity_type: human | service | bot | api_key | oauth_grant`
- [ ] NHI discovery from existing adapters — pull service accounts (AWS IAM), API tokens (GitHub), OAuth apps (Google Workspace, M365), bot users (Slack)
- [ ] NHI inventory dashboard — owner, last used, scopes/permissions, expiry date, risk score
- [ ] Token expiry tracking + auto-rotation workflows via WorkflowDO
- [ ] NHI access reviews — extend Phase 8 campaigns to cover service accounts and API keys
- [ ] NHI offboarding in JML leaver workflows — revoke associated service accounts, rotate shared secrets, disable OAuth grants
- [ ] Compliance evidence auto-generation for NHI lifecycle events (SOC2 CC6.1/CC6.3, ISO27001 A.9.2.6, HIPAA 164.312(d))
- [ ] Files: `packages/shared/src/directory/`, adapters' `/api/nhi` endpoints, `console-app/src/routes/console/directory/`

## Phase 11 — Shadow AI & SaaS Discovery (The New Shadow IT)

> **Strategic context**: Shadow AI has overtaken traditional shadow IT as the #1 visibility risk.
> 75% of employees are expected to acquire technology without IT oversight by 2027 (Gartner).
> JumpCloud added "AI & SaaS Management" in 2026. Nudge Security raised $22.5M for shadow AI detection.
> Torii data shows mid-size orgs average 536 SaaS apps.
>
> **AtlasIT's advantage**: Google Workspace and M365 adapters already have OAuth grant access.
> The MCP agent bus provides a unique angle — detect MCP connections and AI tool usage that
> competitors without an MCP layer can't see. Discovery feeds directly into the compliance
> scoring pipeline (unapproved app = evidence gap).

- [ ] OAuth grant analysis from Google Workspace + M365 admin APIs (adapters already have the scopes)
- [ ] Shadow AI detection — identify unapproved LLM/AI tool OAuth grants, browser extension data flows, MCP server connections
- [ ] Dashboard: discovered vs. managed apps with risk tiers (approved / under review / blocked / unknown)
- [ ] Data flow mapping — show where corporate data flows to unapproved services (especially LLMs)
- [ ] Auto-suggest marketplace install for discovered apps already in the 35-app catalog
- [ ] Auto-create compliance incidents for high-risk discoveries (data flowing to unapproved LLMs, expired OAuth grants with broad scopes)
- [ ] Governance playbooks — configurable auto-responses: notify user, notify admin, block OAuth grant, create access review
- [ ] Compliance mapping — unapproved apps generate detrimental evidence for GDPR Art.5(1)(f), SOC2 CC6.6, ISO27001 A.9.1.2
- [ ] Files: `ai-orchestrator/src/lib/discovery/`, `console-app/src/routes/console/discovery/`, adapter `/api/oauth-grants` endpoints

## Phase 12 — AI-Driven Compliance Intelligence (Beyond Suggestions)

> **Strategic context**: Vanta and Drata both have AI assistants but they're glorified chatbots.
> ConductorOne calls itself "AI-native" but focuses on access decisions, not compliance intelligence.
> The gap is proactive, continuous intelligence — not reactive queries.
>
> **AtlasIT's advantage**: We have the operational data (JML events, access reviews, adapter evidence,
> CDT rule evaluations) that makes AI analysis actionable. Competitors' AI works on static snapshots;
> ours works on live operational streams.

- [ ] Compliance gap analyzer — continuously identify which controls have stale/missing evidence and recommend specific adapter connections or workflow changes to close gaps
- [ ] Risk anomaly detection — surface unusual access patterns from automation execution history (bulk privilege escalation, off-hours provisioning, SoD violations)
- [ ] AI policy generator — auto-generate security policies (access control, incident response, data handling) from control frameworks + tenant's actual configuration, with redline diff for review
- [ ] NL automation builder — `/api/automation/nl` translates natural language to automation rule JSON (Workers AI), already partially built in `packages/shared/src/automation/nl-builder.ts`
- [ ] Compliance drift alerting — detect when operational changes (new app connected, adapter disconnected, policy changed) create compliance regression, emit proactive notifications
- [ ] Security questionnaire learning — improve questionnaire AI (Phase 9) by learning from tenant's previous responses and evidence patterns
- [ ] Files: `packages/shared/src/automation/learner.ts`, `ai-orchestrator/src/lib/compliance-intelligence/`, `console-app/src/routes/console/insights/`

## Phase 13 — Directory Reality (Previously Phase 7)

- [ ] Replace synthetic directory sync with real provider sync (Okta, Google Workspace, Microsoft 365)
- [ ] Directory CRUD + detail pages (users / groups / memberships)
- [ ] Surface "Coming Soon" for unimplemented sync rather than silent 501
- [ ] Group→app mapping based on real directory data (Engineering→GitHub/Jira etc.)

## Phase 14 — Marketplace & OAuth Hardening (Previously Phase 8)

- [ ] OAuth failure UX: actionable error messages + retry paths (no raw redirect errors)
- [ ] Connector health checks + "status honesty" UI (planned → disabled; functional → enabled)
- [ ] Credential encryption enforcement: remove silent plaintext fallback in prod
- [ ] Admin endpoint isolation: cron endpoints behind internal-only access

## Phase 15 — Workflow Trust & Evidence Integrity (Previously Phase 9)

- [ ] Workflow execution reliability: idempotency, DLQ visibility in UI, confidence threshold surfacing
- [ ] Evidence/policy integrity as first-class UX (ingest → verify → display pipeline)
- [ ] Execution history UI with step-level status and compensation visibility
- [ ] R2 evidence deletion protections and access scoping

## Phase 16 — Continuous Validation (Previously Phase 10)

- [ ] Scheduled synthetic crawl + a11y budgets (Playwright + axe, WCAG 2.2)
- [ ] k6 smoke SLO gates for key endpoints (LCP ≤ 2.5s, INP ≤ 200ms at p75)
- [ ] Security scanning: Snyk (pnpm monorepo) + ZAP baseline
- [ ] Platform Status "truthfulness" SLO (functional checks, not just reachability)
- [ ] Journey completion rate metrics: login → dashboard → connect → workflow → evidence

## Phase 17 — Market Readiness & PLG Entry

> **Strategic context**: The compliance market is overwhelmingly sales-led with opaque pricing.
> 187 G2 complaints about Vanta cite inflexible contracts and pricing. The first vendor to offer
> self-serve onboarding with transparent pricing captures the mid-market buyers frustrated by
> being forced through sales calls for a $15K tool.

- [ ] Transparent pricing: self-serve tiers ($X/user/month for IT ops, +$Y/framework for compliance)
- [ ] Free tier — SaaS discovery + compliance assessment (no credit card, PLG funnel)
- [ ] Self-serve onboarding — connect first adapter, see first compliance score in <10 minutes
- [ ] Usage metering + billing infrastructure (Stripe integration)
- [ ] Plugin API for third-party compliance packs and custom frameworks
- [ ] Advanced analytics and reporting (audit-ready dashboards, trend analysis, benchmark vs. peers)

## Long-Term Platform Modules

AtlasIT evolves into a modular platform — **"stop buying two platforms"**:

- **AtlasIT – IT Ops**: JML automation, provisioning, access requests, SSO — replaces JumpCloud/Rippling IT layer
- **AtlasIT – Compliance**: Evidence locker, continuous scoring, trust center, questionnaire AI — replaces Vanta/Drata
- **AtlasIT – Identity**: Human + non-human identity governance, access reviews, SoD detection — replaces ConductorOne/Lumos
- **AtlasIT – Discovery**: Shadow AI/SaaS detection, OAuth grant analysis, data flow mapping — replaces Nudge Security/Torii
- **AtlasIT – Extensions**: Custom connectors, plugin API for third-party compliance packs

### Target Market

| Segment                           | Profile                                                                  | Why AtlasIT wins                                                                 |
| --------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Mid-market (100-1000)**         | Outgrown JumpCloud, can't justify $50K+ for Vanta on top of IT ops spend | One platform at half the cost of two specialized tools                           |
| **Compliance-first SMB (10-100)** | B2B SaaS needing SOC 2 to close enterprise deals                         | Fastest time-to-compliance: connect adapters → evidence generated automatically  |
| **Security-conscious scaleup**    | Engineering-heavy, 200-500 employees, multi-cloud                        | NHI governance + shadow AI detection in the same platform that provisions access |

### Competitive Positioning

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

## Cross-Cutting Concerns

| Concern             | Strategy                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| Schema Evolution    | Versioned D1 migrations + idempotent backfills                            |
| Secrets             | 1Password (vault: AWW_SHARED) + wrangler secret put                       |
| Config              | Environment gating via wrangler.toml [env.*] sections                     |
| Performance         | Precompute aggregates into KV; Queues for heavy ops                       |
| Testing             | Vitest + Miniflare; 719 tests (118 files)                                 |
| Observability       | Structured JSON logging, SLO burn-rate alerting, Analytics Engine metrics |
| IaC                 | Terraform + OPA policies + daily drift detection                          |
| Usability Contracts | DTO mapping layer (snake_case → camelCase) + BFF error normalization      |

## Auto-Update: 2026-03-24

> Generated by local-devops-ai agent loop

### Completed

- [x] **Implement CORS headers** *(dry-run)* — files: src/api.ts, src/middleware.ts

### Needs Attention

- [ ] **Populate canonical tables from raw Tessie data** — LLM produced no code changes
- [ ] **Move service-specific tests to tests/<service>/** — LLM produced no code changes

### Deferred

- [ ] **Update imports to reflect new directory structure** — Unmet dependencies: task-move-service-tests
- [ ] **Append single feed entry referencing all moved groups** — Unmet dependencies: task-update-imports

**Stats:** 3 dispatched, 1 succeeded, 2 failed, 2 skipped (37308ms)

## Auto-Update: 2026-03-24

> Generated by local-devops-ai agent loop

### Completed

- [x] **Configure Rate Limiting** *(dry-run)* — files: src/api-gateway/config.ts
- [x] **Implement CORS Configuration** *(auto-remediated)* — files: src/api-gateway/config.ts

### Needs Attention

- [ ] **Create Tessie Data Reader Script** — Remediation exhausted (3 attempts): LLM produced no code changes

### Deferred

- [ ] **Create Canonical Table Populator Script** — Unmet dependencies: create-tessie-data-reader
- [ ] **Update Data Pipeline to Use New Scripts** — Unmet dependencies: create-canonical-table-populator

**Stats:** 3 dispatched, 2 succeeded (1 remediated), 1 failed, 2 skipped (59546ms)
