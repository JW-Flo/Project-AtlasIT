# AtlasIT Platform Status

**Last updated:** March 2026

## Current State

- **Test suite:** 928 tests passing (103 files), zero failures
- **D1 tables:** 67 tables, 35 migrations applied
- **Package manager:** pnpm (workspace monorepo)
- **Platform:** Cloudflare Workers + D1 + KV + R2 + Queues

## Phase Completion

| Phase                               | Status          | PR         | Key Deliverables                                                                                                                                                                                                                             |
| ----------------------------------- | --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation                      | ✅ Complete     | —          | 3 workers deployed, D1 schemas, shared types, Vitest harness                                                                                                                                                                                 |
| 1 — Workflow Durability + Auth      | ✅ Complete     | #139       | Shared workflow types, EvidenceEmitter, queue dispatch, DLQ, D1 RBAC, shared auth middleware                                                                                                                                                 |
| 2 — MCP Orchestration               | ✅ Complete     | #140       | Compensation dispatch, per-step timeouts, Slack MCP agent, HMAC verification, e2e tests                                                                                                                                                      |
| 3 — Marketplace & Integrations      | ✅ Pre-existing | —          | Marketplace API, connector schema, adapter gen, Google Workspace/Okta connectors, credential vault, feature flags                                                                                                                            |
| 4 — Hardening & Production          | ✅ Complete     | #141       | Okta SCIM 2.0, k6 load tests, IaC drift detection (OPA), OIDC worker, CF-native observability                                                                                                                                                |
| 5 — Adapter Scaffolding             | ✅ Complete     | #158, #159 | 35 marketplace adapters: registry, manifests, scaffolded workers, 9 core-tier implementations, CI/CD deploy matrix                                                                                                                           |
| 6 — Contract Stability              | ✅ Complete     | #164, #165 | RBAC expansion, DTO normalization, safeProxyFetch error handling, startup assertions, JWT rotation logging, Slack verification                                                                                                               |
| 7 — Compliance-as-Automation        | ✅ Complete     | —          | 60 CDT rules, evidence classifier + locker, JML auto-evidence, 40+ control mappings, adapter evidence endpoints (6 adapters), manual evidence upload                                                                                         |
| 7.5 — Compliance Integration        | ✅ Complete     | —          | Scoring unified, scheduled evidence collection, CDT twin expanded (60 rules), twin D1 bridge, remediation catalog (37 controls), policy evaluation wired into scoring pipeline                                                               |
| 8 — Access Reviews                  | ✅ Complete     | —          | Campaign CRUD, manager review UI, auto-revoke on expiry, evidence generation per cycle, `request_access_review` automation action                                                                                                            |
| 9 — Trust Center & Questionnaire AI | ✅ Complete     | —          | Evidence provenance trail, per-control visibility (public/NDA/private), NDA access workflow, CSV/JSON export with tamper hash, questionnaire AI (Groq), SVG trust badge                                                                      |
| 10 — Stabilization & JML Reality    | ✅ Complete     | #253–#275  | JML pipeline hardened, 139 controls (was 25), scoring pipeline fix (no more stale 100%), directory sync through orchestrator, group-app mapping persistence, OAuth failure UX, connector health indicators, credential encryption validation |
| 11 — NHI Governance                 | ✅ Complete     | #276       | NHI discovery, inventory dashboard, token expiry tracking, NHI access reviews, leaver workflow NHI revocation                                                                                                                                |
| 12 — Shadow AI & SaaS Discovery     | ✅ Complete     | #277       | OAuth grant analysis, shadow AI detection, discovered vs managed apps, governance playbooks                                                                                                                                                  |
| 13 — AI Compliance Intelligence     | ✅ Complete     | #282       | Gap analyzer (83 controls), drift alerting, risk anomaly detection, AI policy generator (5 types + redline diff), NL builder gap awareness, questionnaire learning, Insights UI                                                              |
| 13+ — Security Audit Remediation    | ✅ Complete     | #282       | Token purge + rotation, fail-closed auth, workers_dev=false, SHA-pinned CI, Gitleaks, Terraform hardening, Vite CVE patch                                                                                                                    |
| 13+ — Workflow Redesign (Roles)     | ✅ Complete     | #283       | Roles as first-class entity (hierarchy), CRUD API, JML role-based provisioning, Lifecycle Policies tab, 8 seeded roles + 15 entitlements                                                                                                     |
| 14 — Workflow Trust & Evidence      | ✅ Complete     | #284       | Step idempotency, DLQ console UI, evidence retention protections, auth hardening (DLQ reads + workflow GET), Operations admin page                                                                                                           |
| 15 — Continuous Validation          | ✅ Complete     | #285       | k6 SLO scripts, Snyk + ZAP CI, Playwright smoke CI, deep health checks, journey completion metrics                                                                                                                                           |
| 15.5 — Platform Polish & Evidence   | 🔴 Next         | —          | Fix NHI/SaaS discovery, evidence card expand, auto-evidence collection, auto-tagging, operations data enrichment, badge color fixes                                                                                                          |
| 16 — Market Readiness & PLG Entry   | 📋 Planned      | —          | Pricing, billing (Stripe), self-serve onboarding, analytics                                                                                                                                                                                  |

## Deployed Workers

| Worker                     | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `core-api`                 | Central API: tenants, events, agents, flags, credentials |
| `ai-orchestrator`          | Workflow execution, event routing, queue consumer        |
| `compliance-worker`        | Compliance scoring, policy evaluation, evidence          |
| `onboarding`               | Tenant provisioning                                      |
| `dispatch-worker`          | Queue-driven step execution dispatch                     |
| `scheduler-worker`         | Cron-based scheduled task execution                      |
| `slack-notification-agent` | Outbound Slack notifications via MCP events              |
| `slack-approval-worker`    | Slack interactive approval workflows                     |
| `documentation-worker`     | Docs serving                                             |
| `marketplace`              | App catalog and install/uninstall management             |
| `apex-redirect-worker`     | Root domain redirect handling                            |
| `mcp`                      | MCP server (desktop agent protocol)                      |
| `mcp-idp`                  | MCP identity provider (OIDC/SAML bridge)                 |
| `mcp-mobile`               | MCP mobile client endpoint                               |
| `ops/oidc`                 | GitHub Actions OIDC → 1Password exchange                 |
| `infra/github-proxy`       | GitHub API proxy for CI                                  |
| `shared/services/cdt`      | Compliance Definition & Testing rule engine              |
| `console-app`              | SvelteKit frontend (CF Pages)                            |
| `apps/atlasit-web`         | Marketing / landing site                                 |

## Infrastructure

- **D1:** `ATLAS_SHARED_DB` (tenants, users, compliance, audit, console_user_roles, directory)
- **KV:** `KV_SESSIONS`, `KV_CACHE`, `KV_FEATURE_FLAGS`, `MCP_STORE`
- **R2:** `atlasit-evidence` (policies, evidence, artifacts)
- **Queues:** `atlasit-step-tasks` (workflow step dispatch)

## What's Built

- Console app (SvelteKit + Tailwind, CF Pages)
- D1-backed RBAC (CF Access JWT → roles from D1, fallback to viewer)
- Hierarchical requireRole middleware (viewer < member < admin) on all 27 mutation routes
- Shared auth middleware (core-api, ai-orchestrator)
- WorkflowDO (Durable Object): state machine, compensation, per-step timeouts, DLQ escalation
- Event router with fan-out, agent registry, HMAC signature verification
- MCP agent SDK (`packages/mcp-sdk`)
- Evidence locker (R2-backed, SHA-256 content addressing)
- Policy evaluation engine (Boolean allow/deny, wired into compliance scoring)
- Rate limiting + security headers middleware
- Credential vault (AES-GCM envelope encryption)
- Feature flag system (KV-backed, rollout %, tenant overrides)
- Okta adapter with SCIM 2.0 provisioning
- k6 load tests (smoke/load/stress/soak)
- IaC drift detection (OPA/Conftest policies, GH Actions)
- CF Workers-native observability (W3C traceparent tracer, Analytics Engine metrics)
- Structured logging with SLO definitions and burn-rate alerting
- Compliance intelligence: gap analyzer (83 controls), drift alerting, risk anomaly detection
- AI policy generator (5 types: access control, incident response, data handling, password, acceptable use)
- Roles system: hierarchical (org → dept → team), assignable to users/groups, inherited entitlements
- Lifecycle Policies UI: identity-grounded workflow management (replaces app-centric view)
- Step-level idempotency in WorkflowDO (prevents double-execution on lost responses)
- DLQ admin console with per-entry replay, workflow runs detail view
- Evidence retention: soft-delete with deletion protection for active controls
- Deep health API: functional checks (D1/KV/R2) across all workers, not just reachability
- Journey completion metrics: 5-step activation funnel per tenant
- Gitleaks CI + expanded project secret scanner
- k6 SLO smoke + load baseline scripts
- Weekly Snyk + ZAP security scanning CI

## Marketplace Adapters (35 apps)

| Status                 | Adapters                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Production (stable) | Okta, Google Workspace                                                                                                                                                                                |
| 🟡 Core-tier (alpha)   | Microsoft 365, Slack, Jira, GitHub, Stripe, AWS, Azure, Workday, ADP, CrowdStrike, GCP                                                                                                                |
| 🟢 Implemented (beta)  | Confluence, QuickBooks, Xero, Zoom, Teams, Discord, BambooHR, Auth0, 1Password, PagerDuty, Datadog, Salesforce, HubSpot, Dropbox, Notion, Zendesk, Asana, Monday, DocuSign, Figma, Canva, **Zscaler** |
