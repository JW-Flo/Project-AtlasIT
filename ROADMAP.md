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

- [x] Expand CDT rules from 7 → 53 (SOC 2, ISO 27001, HIPAA, NIST CSF, GDPR Article 5 coverage)
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

### Integration Gaps (Phase 7.5 — see below)

- [ ] **Scoring paths are disconnected** — UI reads `tenant_preferences.compliance_controls` (manual checklist); compliance-worker computes evidence-grounded scores via `/api/v1/cdt/evaluate` but these never feed back to the UI
- [ ] **`storeEvidence()` is never called** — classifier + locker are defined in `packages/shared` but no caller wires them into the orchestrator event consumer or any route handler
- [ ] **CDT twin runs 7 of 53 rules** — `/twin/event` handler has a hardcoded 7-control subset; remaining 46 rules are dead code
- [ ] **CDT twin state is isolated in KV** — no other component reads the twin's KV state or R2 evidence blobs
- [ ] **No scheduled evidence collection** — `POST /api/v1/evidence/collect` works but nothing calls it on a schedule
- [ ] **Policy evaluation is a stub** — `evaluatePolicy()` hashes the input and returns it; no Rego or Boolean policy logic runs

## Phase 7.5 — Compliance Integration (Close the Loop)

> **Why this matters**: All compliance building blocks exist but are disconnected. The dashboard
> shows a manual checklist while real evidence-grounded scores sit unused. Closing these gaps
> turns the compliance system from a demo into a differentiator.

### P0 — Unify Scoring (UI shows real evidence-grounded scores)

- [ ] Console `/api/tenant-compliance/scores` reads from `compliance_evidence` (via compliance-worker CDT evaluate) instead of `tenant_preferences.compliance_controls`
- [ ] Evidence-grounded scores write to `compliance_scores` + `compliance_history` tables (same as today)
- [ ] Deprecate `tenant_preferences.compliance_controls` as score source; retain for manual status overrides only

### P1 — Wire Evidence Pipeline End-to-End

- [ ] Orchestrator event consumer calls `storeEvidence()` for every classified event flowing through the system
- [ ] Adapter evidence collection runs on a schedule (cron in `scheduler-worker` or orchestrator automation rule)
- [ ] Evidence from adapters and events appears in `compliance_evidence` → feeds scoring → feeds UI

### P2 — Expand CDT Twin Coverage

- [ ] CDT twin `/twin/event` evaluates all 53 rules (remove hardcoded 7-control subset)
- [ ] Bridge CDT twin KV state back to `compliance_evidence` or deprecate twin in favor of compliance-worker path
- [ ] Expand remediation catalog beyond 2 controls (currently: `SOC2-CC6.2`, `ISO-27001-A.9.2.3` only)

### P3 — Policy Evaluation

- [ ] Replace stub `evaluatePolicy()` with real policy logic (Boolean allow/deny decisions)
- [ ] Wire policy evaluation into compliance scoring (policy pass/fail → control status)

### Files

- `console-app/src/routes/api/tenant-compliance/scores/+server.ts`
- `ai-orchestrator/src/lib/event-consumer.ts` (or equivalent)
- `scheduler-worker/` (add evidence collection cron)
- `shared/services/cdt/src/index.ts` (expand twin evaluation loop)
- `compliance-worker/src/modules/policies/evaluation.ts`

## Phase 8 — Access Reviews (Table Stakes for IGA)

> Required for SOC 2 CC6.1/CC6.3 and ISO 27001 A.9.2.5. Lumos, Zluri, ConductorOne all have this.
> Currently the biggest feature gap for compliance-conscious SMB buyers.

- [ ] Campaign creation (scope: all apps / specific apps / departments)
- [ ] Manager-facing review UI — approve/revoke per user/app
- [ ] Auto-revoke on campaign expiry (configurable grace period)
- [ ] Evidence generation per review cycle (R2 artifact + compliance control linkage)
- [ ] New D1 tables: `access_review_campaigns`, `access_review_items`, `access_review_decisions`
- [ ] Files: `console-app/src/routes/console/access-reviews/`, new D1 migration, new automation action type `request_access_review`

## Phase 9 — Trust Center (Compete with Vanta Trust Reports)

> Public-facing, tenant-branded compliance portal. Powered by real operational evidence —
> more credible than Vanta's checkbox-driven trust reports.

- [ ] Public route `/trust/{tenantSlug}` — framework scores, last audit date, connected integrations, evidence count
- [ ] Tenant controls visibility via settings (what's public vs. private)
- [ ] PDF export for auditor packages
- [ ] Files: `console-app/src/routes/trust/`, new `GET /api/trust/[slug]` server route

## Phase 10 — AI Policy Suggestions (Compete with Lumos)

> Lumos charges premium for AI policy generation. AtlasIT's learner already does pattern-based
> suggestions — extending it to compliance inference closes that gap.

- [ ] Extend `packages/shared/src/automation/learner.ts` to suggest RBAC/ABAC policies from access patterns
- [ ] Compliance suggestion types: "missing evidence for control X", "access pattern violates SoD"
- [ ] Feed automation execution history into compliance scoring
- [ ] NL automation builder: `/api/automation/nl` → translates natural language to rule JSON (Workers AI)
- [ ] Files: `packages/shared/src/automation/learner.ts`, `console-app/src/routes/console/automation/`

## Phase 11 — SaaS Discovery (Shadow IT Detection)

> BetterCloud, Torii, Zluri all lead with discovery. AtlasIT can leverage existing
> Google Workspace + M365 adapters to detect OAuth grants = shadow IT.

- [ ] Analyze OAuth grants from Google Workspace / M365 admin APIs (adapters already exist)
- [ ] Dashboard: discovered vs. managed apps with risk classification
- [ ] Auto-suggest marketplace install for discovered apps already in catalog
- [ ] Files: New module in `ai-orchestrator/src/lib/`, console dashboard additions

## Phase 12 — Non-Human Identity Management (2026–2027 Frontier)

> Fastest-growing attack surface. Lumos identified this as the next IGA frontier.
> Most platforms ignore service accounts, API tokens, bot credentials.

- [ ] Extend directory schema: `identity_type: human | service | bot | api_key`
- [ ] Token expiry tracking + auto-rotation workflows
- [ ] Surface non-human identities in directory UI + access reviews
- [ ] Non-human identity provisioning via adapters (GitHub tokens, AWS IAM roles, etc.)

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

## Phase 17 — Market Readiness (Previously Phase 11)

- [ ] Multi-tenant billing and usage metering (flat-rate tiers: Free/$99/$299/Custom)
- [ ] LLM-backed policy refinement with redline diff
- [ ] Real-time risk anomaly detection + compliance drift alerting
- [ ] Plugin API for third-party compliance packs
- [ ] Advanced analytics and reporting

## Long-Term Platform Modules

AtlasIT evolves into a modular platform:

- **AtlasIT – IT Ops**: IAM automation, provisioning, SSO
- **AtlasIT – Compliance**: Evidence locker, reporting, regulatory alignment (SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR)
- **AtlasIT – IdP**: Unified IdP abstraction + fallback OIDC/SAML service for SMBs
- **AtlasIT – AI Security**: Automated detection, remediation, and AI-driven recommendations
- **AtlasIT – Extensions**: Custom connectors, plugin API for third-party compliance packs

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
