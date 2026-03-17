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
  ↓ Adapter calls (provision / revoke / sync across 33 apps)
  ↓ Evidence emitted → compliance-worker scores
  ↓ Score change → new event → rules re-evaluate
```

### No-Brainer Backend Automations

| Scenario                    | Trigger                              | What Happens Automatically                                                                 |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| **New hire onboarding**     | `user.created` from Okta/M365/Google | Provision GitHub, Jira, Slack, email + all role-assigned apps; notify manager on Slack     |
| **Employee offboarding**    | `user.deactivated`                   | Revoke access across all connected apps; emit offboarding evidence; create audit record    |
| **Department transfer**     | `group.membership_changed`           | Update app entitlements, reassign RBAC roles, re-sync directory                            |
| **App connected**           | `app_connected`                      | Auto-provision existing users that match group rules; start health checks                  |
| **Compliance scan**         | Cron schedule                        | Collect evidence from connected tools, re-score controls, create incidents on failures     |
| **Policy violation**        | `compliance_score_changed`           | Auto-create incident, notify ops via Slack, trigger remediation workflow                   |
| **Access request approved** | Workflow gate cleared                | Provision app access within seconds, no manual ops steps                                   |

### Components That Make It Real

- **AutomationDO** — per-tenant rule engine; 9 trigger types, 8 action types, 5-min dedup TTL
- **WorkflowDO** — durable joiner/mover/leaver with per-step timeouts and DLQ-backed compensation
- **33 adapters** — Okta, Google Workspace, M365, Slack, GitHub, Jira, Confluence, Stripe, AWS, Azure, GCP, Salesforce, HubSpot, and 20 more
- **MCP agent bus** — HMAC-verified agent webhooks; Slack notifier live, extensible to PagerDuty, email, Jira
- **compliance-worker** — Rego-based policy eval, R2 evidence storage, auto-scoring across 5 frameworks

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

## Phase 5 — Adapter Scaffolding ✅ (PR #158, #159)

- [x] Registry data for all 33 apps (`shared/integrations/registry-detailed.ts`)
- [x] ConnectorManifest templates for all apps (`packages/connector-schema/src/templates.ts`, 2300+ lines)
- [x] Scaffold all adapters via `adapter-gen` into `adapters/<slug>/` (PR #158)
- [x] Implement 21 SaaS adapters with directory sync, webhooks, and auth (PR #159)
- [x] Hand-write core-tier implementations (9 apps): Microsoft 365, Slack, Jira, GitHub, Stripe, AWS, Azure, + Okta, Google Workspace (production)
- [x] Update `adapters/registry.json` with all 33 entries
- [x] Add adapter deploy jobs to CI/CD (`deploy-on-merge.yml` — dynamic matrix)
- [x] Expand adapter catalog from 24 → 33 apps (added Salesforce, HubSpot, Dropbox, Notion, Zendesk, Asana, Monday, DocuSign, Figma, Canva)
- [ ] Update console-app integration statuses to match registry (planned → alpha/beta)
- [ ] Seed marketplace DB with all 33 apps
- [ ] Add missing JML workflow YAMLs

## Phase 6 — Contract Stability & Auth Hardening (Next)

- [ ] Standardize DTO mapping (snake_case → camelCase) across all BFF proxy routes
- [ ] Normalize error handling: no raw HTML/JSON crashes surfaced to UI; all errors must be actionable
- [ ] Expand RBAC permission matrix until every mutation route is guarded
- [ ] Add startup-failing assertions for missing prod secrets (CRED_ENCRYPTION_KEY, D1 bindings, etc.)
- [ ] CF Access JWT signing key rotation readiness (dynamic key fetch, not hard-pinned)
- [ ] Slack webhook verification alignment with Slack's replay window algorithm

## Phase 7 — Directory Reality (Future)

- [ ] Replace synthetic directory sync with real provider sync (Okta, Google Workspace, Microsoft 365)
- [ ] Directory CRUD + detail pages (users / groups / memberships)
- [ ] Surface "Coming Soon" for unimplemented sync rather than silent 501
- [ ] Group→app mapping based on real directory data (Engineering→GitHub/Jira etc.)

## Phase 8 — Marketplace & OAuth Hardening (Future)

- [ ] OAuth failure UX: actionable error messages + retry paths (no raw redirect errors)
- [ ] Connector health checks + "status honesty" UI (planned → disabled; functional → enabled)
- [ ] Credential encryption enforcement: remove silent plaintext fallback in prod
- [ ] Admin endpoint isolation: cron endpoints behind internal-only access

## Phase 9 — Workflow Trust & Evidence Integrity (Future)

- [ ] Workflow execution reliability: idempotency, DLQ visibility in UI, confidence threshold surfacing
- [ ] Evidence/policy integrity as first-class UX (ingest → verify → display pipeline)
- [ ] Execution history UI with step-level status and compensation visibility
- [ ] R2 evidence deletion protections and access scoping

## Phase 10 — Continuous Validation (Future)

- [ ] Scheduled synthetic crawl + a11y budgets (Playwright + axe, WCAG 2.2)
- [ ] k6 smoke SLO gates for key endpoints (LCP ≤ 2.5s, INP ≤ 200ms at p75)
- [ ] Security scanning: Snyk (pnpm monorepo) + ZAP baseline
- [ ] Platform Status "truthfulness" SLO (functional checks, not just reachability)
- [ ] Journey completion rate metrics: login → dashboard → connect → workflow → evidence

## Phase 11 — Market Readiness (Future)

- [ ] Multi-tenant billing and usage metering
- [ ] LLM-backed policy refinement with redline diff
- [ ] Real-time risk anomaly detection
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
| Testing             | Vitest + Miniflare; 356 tests (49 files)                                  |
| Observability       | Structured JSON logging, SLO burn-rate alerting, Analytics Engine metrics |
| IaC                 | Terraform + OPA policies + daily drift detection                          |
| Usability Contracts | DTO mapping layer (snake_case → camelCase) + BFF error normalization      |
