# AtlasIT Roadmap (High-Level)

Status: Living document – last updated <!--DATE-->

This roadmap enumerates _unimplemented_ phases required to reach the UI/feature breadth captured in design mockups (compliance center, policy generation, risk dashboard). Production today: three Workers (onboarding, orchestrator, docs).

## Phase 1 – UI & Stub Layer

- SvelteKit (or Next.js) frontend scaffold
- Auth placeholder (dev token)
- Stub endpoints: compliance score, frameworks list, policy list (empty)
- Dashboard renders without console errors
  **Exit:** Manual smoke shows stable layout + stub JSON <50ms

## Phase 2 – Compliance Core

- D1 migrations: `compliance_framework_status`, `compliance_audits`, `risk_events`
- Cron job compute compliance composite score every 15m
- `/compliance/score`, `/compliance/frameworks`, `/compliance/audit-timeline`
- Basic risk event ingestion + matrix derivation
  **Exit:** Real score persists, delta tracking working

## Phase 3 – Policy Engine

- Tenant profile model (industry, size, requirements)
- Template library (Markdown with tokens)
- Generation endpoint writes versioned policies to KV + index rows
- Customization patch endpoint with diff guardrails
  **Exit:** Generate 5 canonical policies for a tenant in <2s

## Phase 4 – Directory & Lifecycle (JML)

- Okta sync (users, groups) cached in D1
- Lifecycle workflow triggers via orchestrator (joiner/mover/leaver events -> tasks)
- Metrics: active users, pending access requests
  **Exit:** New Okta user visible in dashboard <2m

## Phase 5 – Reporting & Export

- Report assembler (compliance + risk + policies snapshot)
- Export formats: Markdown first, PDF second (wkhtmltopdf or API service)
- Signed download URLs (short-lived HMAC token)
  **Exit:** Downloaded report hash logged & verifiable

## Phase 6 – Hardening & Observability

- Structured logs + correlation id
- Rate limiting tiers (public vs internal)
- Metrics endpoint (/metrics) w/ counters & p95 latency gauge
- Security pipeline: dependency audit + simple Semgrep rules gating
  **Exit:** p95 <75ms; 0 high vulnerabilities; comprehensive request logging

## Future (Out-of-Scope for Current Plan)

- Marketplace (integration templates)
- LLM-backed policy refinement with redline diff validation
- Real-time risk anomaly detection
- Multi-tenant billing / usage metering
- Plugin API for third-party compliance packs

## Cross-Cutting Concerns

| Concern          | Strategy                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| Schema Evolution | Versioned D1 migrations + idempotent backfills                         |
| Secrets          | Cloudflare secrets + rotated per environment; no plaintext commits     |
| Config           | Central `config.ts` with environment gating; no inline magic constants |
| Performance      | Precompute heavy aggregates (score, matrix) into KV snapshot           |
| Rollback         | Keep prior worker names active for 1 deploy window when renaming       |

## Status Matrix

| Phase | State       | Notes                                              |
| ----- | ----------- | -------------------------------------------------- |
| 1     | IN PROGRESS | Creating stub endpoints and planning UI framework  |
| 2     | NOT STARTED | Depends on Phase 1 endpoints contract              |
| 3     | NOT STARTED | Template authoring blocked until Phase 1 UI slots  |
| 4     | NOT STARTED | Requires Okta app credentials & sync window design |
| 5     | NOT STARTED | Waits on stable compliance + policy datasets       |
| 6     | NOT STARTED | Metrics scaffolding delayed until real traffic     |

---

Track changes via PRs labeled `roadmap` and link deliverables to this file.
