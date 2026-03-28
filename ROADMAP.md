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

## Phase 7.5 — Compliance Integration (Close the Loop) ✅

> **Why this matters**: All compliance building blocks exist but were disconnected. Closing these gaps
> turns the compliance system from a demo into a differentiator.

### P0 — Unify Scoring (UI shows real evidence-grounded scores) ✅

- [x] Console `/api/tenant-compliance/scores` reads from `compliance_evidence` (via compliance-worker CDT evaluate) instead of `tenant_preferences.compliance_controls`
- [x] Evidence-grounded scores write to `compliance_scores` + `compliance_history` tables (same as today)
- [x] Score blending: takes MAX(evidence-grounded, self-assessed) per framework so manual status updates aren't overridden
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

### P4 — Controls & Evidence UX Hardening ✅ (PRs #253–#274)

- [x] Expand FRAMEWORK_CONTROLS from 5/framework to realistic counts (SOC2: 33, ISO27001: 56, NIST CSF: 22, HIPAA: 15, GDPR: 12 = 139 total)
- [x] CONTROL_TO_CDT_PREFIXES mapping bridges simplified control IDs to CDT evidence prefixes
- [x] Evidence drill-down: control expand row passes CDT prefixes for LIKE matching (was returning "No evidence found")
- [x] Evidence locker pagination: rawLimit = pageSize × 5 to compensate for grouping
- [x] Stale tenant controls auto-migrate to expanded 139-control set, preserving existing statuses/notes
- [x] Evidence dropdown: full 139 controls from FRAMEWORK_CONTROLS, filtered by tenant's selected frameworks
- [x] Control ID normalization: buildDefaultControls IDs match CONTROL_TO_CDT_PREFIXES keys
- [x] Compliance score sync: blends MAX(evidence-grounded, self-assessed) per framework

### Files Changed

- `console-app/src/routes/api/tenant-compliance/scores/+server.ts` — unified scoring via compliance-worker
- `console-app/src/routes/api/tenant-compliance/controls/+server.ts` — evidence counts per control, stale control migration
- `console-app/src/routes/console/compliance/+page.svelte` — evidence coverage indicators, CDT prefix drill-down, expanded dropdown
- `console-app/src/lib/compliance/framework-controls.ts` — 139 controls, CDT mapping, aggregation function
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

## Phase 10 — Platform Stabilization & JML Reality ✅ (PRs #253–#275)

> **Why before NHI/Shadow AI**: Phases 0-9 built the feature surface. PRs #253-#274 exposed
> significant integration gaps — controls not linking to evidence, scores not syncing, workflows
> stuck at 0/2, incidents not persisting, UI rendering stale data. The platform needed a hardening
> pass before adding new feature categories. Directory sync was still synthetic, which blocked
> real-world JML workflows.

### JML Pipeline Hardening ✅

- [x] Provision/deprovision routes implemented on all 5 core adapters (GitHub, Okta, Slack, Microsoft 365, AWS)
- [x] ADAPTER_URLS expanded to 20 adapters in both ai-orchestrator and compliance-worker
- [x] WorkflowDO correlationId fix — queue messages now route to correct Durable Object instance
- [x] Activity stream writes during automation rule execution (Live Feed was empty)
- [x] JML table display: camelCase DTO matching for steps_done/started_at fields
- [x] Mover workflow modal: department, title, manager, groups, and app fields for role transitions
- [x] Dashboard automation rows clickable with navigation to execution detail

### Incidents & Actions ✅

- [x] Incidents API reads from ATLAS_SHARED_DB (was proxying to compliance-worker's D1_COMPLIANCE — different DB)
- [x] Automation actions emit to shared DB so incident creation is visible in console

### UI Polish ✅

- [x] Tab visual differentiation — active tab uses bg-primary color
- [x] Evidence locker pagination fix (rawLimit = pageSize × 5 for grouping)
- [x] Simulation history persistence and deduplication
- [x] Automation execution detail view with step-level results

### Directory & Connector Reality ✅ (PR #275)

- [x] **Directory sync through orchestrator** — new `/api/v1/directory/sync` route proxies to correct adapter worker via ADAPTER_URLS; falls back to synthetic data when orchestrator unavailable
- [x] Group-app mapping persistence — DELETE/PATCH handlers on `/api/directory/mappings`; group detail page loads and persists app assignments through API
- [x] App display names in mappings tab (was showing raw IDs like "github")
- [x] OAuth failure UX — callback errors displayed as toast on marketplace page with URL cleanup
- [x] Connector health indicators — green/red/gray dot on marketplace cards based on adapter health status
- [x] Credential encryption validation — production startup check warns if CRED_ENCRYPTION_KEY missing
- [x] **Scoring pipeline fix** — control ID normalization (`soc2_cc1.1_-_...` → `soc2_cc1_1_...`) so evidence correctly maps to all 139 controls; stale 5-per-framework controls auto-expand to 139; scores always computed fresh from controls (no more stale cached 100%)
- [x] Files: `ai-orchestrator/src/routes/directory.ts`, `console-app/src/routes/api/directory/`, `console-app/src/routes/api/tenant-compliance/scores/+server.ts`, `console-app/src/hooks.server.ts`, `console-app/src/lib/server/credentials.ts`

## Phase 11 — Non-Human Identity Governance (Hottest IGA Category)

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

## Phase 12 — Shadow AI & SaaS Discovery (The New Shadow IT)

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

## Phase 13 — AI-Driven Compliance Intelligence (Beyond Suggestions) ✅ (PR #282)

> **Strategic context**: Vanta and Drata both have AI assistants but they're glorified chatbots.
> ConductorOne calls itself "AI-native" but focuses on access decisions, not compliance intelligence.
> The gap is proactive, continuous intelligence — not reactive queries.
>
> **AtlasIT's advantage**: We have the operational data (JML events, access reviews, adapter evidence,
> CDT rule evaluations) that makes AI analysis actionable. Competitors' AI works on static snapshots;
> ours works on live operational streams.

- [x] Compliance gap analyzer — 83 analyzable controls across 5 frameworks, 28 control-specific recommendations covering audit logs, SoD, offboarding, HIPAA depth
- [x] Risk anomaly detection — bulk privilege escalation (>5/hr), off-hours provisioning, unusual revocation volume (>10/hr) from automation execution history
- [x] AI policy generator — 5 policy types (access control, incident response, data handling, password, acceptable use) with Groq AI + LCS-based redline diff
- [x] NL automation builder — enhanced with compliance gap awareness, existing rules dedup, closesGaps/possibleDuplicate fields
- [x] Compliance drift alerting — adapter disconnect, health failure, rule disable, score regression mapped to affected controls
- [x] Security questionnaire learning — prior accepted/edited responses used for answer consistency
- [x] Files: `packages/shared/src/compliance-intelligence/`, `console-app/src/routes/api/compliance-intelligence/`, `console-app/src/routes/console/insights/`, `ai-orchestrator Duty 6`
- [x] 40 unit tests across 6 test files

### Security Audit Remediation (included in PR #282)

- [x] Removed committed DISPATCH_ADMIN_TOKEN, purged from git history, rotated on workers
- [x] Fail-closed admin auth (503 when ADMIN_BEARER/ADMIN_TOKEN unconfigured)
- [x] Disabled workers_dev on 5 production workers
- [x] SHA-pinned all CI actions + top-level permissions: contents: read
- [x] Expanded secret scanner + Gitleaks CI workflow + .gitleaks.toml
- [x] Terraform hardening: remote state stubs, sensitive vars, tflint + tfsec in CI
- [x] Vite upgraded past CVE-2025-62522

### Workflow Redesign: Identity-Grounded Lifecycle Management (PR #283)

- [x] Roles as first-class entity: `roles`, `role_app_entitlements`, `role_assignments` tables with hierarchy (org → department → team)
- [x] Full CRUD API at `/api/roles/` with entitlement and assignment management
- [x] JML engine updated: role-based provisioning (with inheritance) + legacy group_app_mappings fallback
- [x] Workflows page redesigned: Lifecycle Policies tab (default), Users tab, Activity tab
- [x] Production D1 seeded: 8 lifecycle roles, 15 entitlements, 3-level hierarchy
- [x] 9 unit tests for role resolution

## Phase 14 — Workflow Trust & Evidence Integrity ✅ (PR #284)

- [x] Step-level idempotency: WorkflowDO generates idempotencyKey per attempt, step executor deduplicates before re-execution
- [x] DLQ visibility in console UI: /console/admin/operations with Dead Letter Queue + Workflow Runs tabs, per-entry replay
- [x] Evidence retention: enforceRetentionPolicy() soft-delete, isEvidenceDeletionAllowed() protects active control evidence
- [x] R2 evidence remains immutable (write-once, content-addressed); retention only marks D1 rows
- [x] DLQ read endpoints + workflow GET /:id protected with requireRole("member") + tenant scoping
- [x] Admin endpoint isolation: cron handler inherently internal (CF Workers scheduled()), scheduler /internal/run requires DEBUG_KEY
- [x] 6 unit tests for evidence retention

## Phase 15 — Continuous Validation ✅ (PR #285)

- [x] k6 smoke SLO scripts: smoke (5 VUs, 30s) + load baseline (10 VUs ramped), p95 < 2500ms threshold
- [x] Security scanning CI: weekly Snyk + ZAP baseline (.github/workflows/security-scan.yml)
- [x] Playwright smoke CI: deployment_status trigger, SHA-pinned actions, artifact upload
- [x] Platform Status truthfulness: /api/platform/health-deep verifies D1/KV/R2 functional checks across all workers
- [x] Journey completion rate metrics: /api/platform/journey-metrics tracks 5-step activation funnel per tenant
- [x] Existing site crawl + axe a11y scanning (WCAG 2.2) already in tests/full/site-crawl.spec.ts

## Phase 15.5 — Platform Polish & Evidence Automation

> **Context**: User-reported issues from QA review of Phases 13-15. The platform has the right features
> but several UX gaps, broken flows, and missed automation opportunities reduce trust and increase friction.
> This phase focuses on fixing what's broken and automating what's manual before adding new features.

### P0 — Broken Features

- [ ] **NHI Discovery failing** — `/console/discovery` NHI tab errors; investigate and fix adapter NHI endpoint calls
- [ ] **SaaS & AI Discovery failing** — Shadow AI discovery scan returning errors; debug OAuth grant analysis flow and adapter connectivity
- [ ] **Evidence card click-through broken** — Evidence items in the evidence locker/feed are clickable but don't expand or open detail view; implement expand/detail panel showing full evidence payload, R2 content hash, source metadata, and linked controls

### P1 — Evidence Automation (Reduce Friction)

- [ ] **Auto-evidence collection from connected adapters** — For each gap identified by the gap analyzer, automatically attempt to pull correlating evidence from connected systems instead of requiring manual upload. Map controls to adapter evidence endpoints (e.g., CC6.1 → Okta MFA policy status, CC7.5 → adapter audit log settings, A.9.2.6 → offboarding completion records)
- [ ] **Auto-tagging evidence** — When evidence is ingested (from adapters, automation rules, or platform state probes), automatically tag with: framework, control IDs, evidence category, impact level, and confidence score. Remove the "+ Tag" manual interaction for system-generated evidence
- [ ] **Evidence gap → adapter mapping** — On the Insights page, when a gap is shown for a control that has a connected adapter capable of providing evidence, show a "Collect Now" button that triggers immediate evidence pull from that adapter
- [ ] **Platform state evidence expansion** — Expand `collectPlatformStateEvidence()` probes to cover more controls: RBAC configuration evidence (CC5.2, CC6.1), encryption at rest (CC7.4), directory sync recency (A.9.2.1), automation rule coverage (CC4.1)

### P2 — Operations & UI Polish

- [ ] **Operations page data enrichment** — Workflow Runs tab shows missing data (empty User Email, App ID, Subject fields). Populate from workflow context/trigger event payload. Show step-level detail in expanded rows (action name, status, duration, output)
- [ ] **"Running" badge color fix** — Running status badge uses `bg-blue-500 text-blue-100` which is barely readable on dark backgrounds. Change to `bg-blue-600 text-white` or use the existing theme's primary color
- [ ] **Deep health compliance reachability** — Worker-to-worker call to compliance endpoint reports `reachable: false` due to edge-to-edge routing. Use service binding or internal fetch instead of public URL
- [ ] **Evidence locker pagination** — Evidence feed returns 432 items but only shows ~20; ensure proper pagination with load-more/infinite scroll
- [ ] **Insights page gap recommendations** — Currently all gaps show generic "Connect relevant adapters" text. Replace with specific adapter names when the tenant has that adapter connected (e.g., "Collect MFA policy evidence from your connected Okta adapter")

### Files likely affected

- `console-app/src/routes/console/compliance/+page.svelte` — evidence card expand
- `console-app/src/routes/api/evidence-feed/+server.ts` — auto-tagging, pagination
- `console-app/src/routes/console/insights/+page.svelte` — adapter-specific recommendations
- `console-app/src/routes/console/admin/operations/+page.svelte` — data enrichment, badge color
- `console-app/src/routes/console/discovery/+page.svelte` — NHI + SaaS discovery fixes
- `packages/shared/src/evidence/adapter-collector.ts` — expanded evidence collection
- `packages/shared/src/evidence/platform-state-collector.ts` — expanded state probes
- `packages/shared/src/compliance-intelligence/gap-analyzer.ts` — adapter-aware recommendations
- `ai-orchestrator/src/index.ts` — evidence auto-collection on gap detection

## Phase 16 — Market Readiness & PLG Entry

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
| Testing             | Vitest + Miniflare; 928 tests (103 files), k6 SLO smoke + load baseline   |
| Observability       | Structured JSON logging, SLO burn-rate alerting, Analytics Engine metrics |
| IaC                 | Terraform + OPA policies + daily drift detection                          |
| Usability Contracts | DTO mapping layer (snake_case → camelCase) + BFF error normalization      |
