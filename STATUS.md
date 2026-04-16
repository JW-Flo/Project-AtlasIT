# AtlasIT Platform Status

**Last updated:** 2026-04-16

## Current State

- **Platform:** AWS-native (Lambda + Aurora PG + DynamoDB + S3 + SQS + CloudFront). Migration gate PASSED 2026-04-12. Stability window active until 2026-04-25.
- **Package manager:** pnpm (workspace monorepo)
- **Console app:** SvelteKit SPA on S3/CloudFront. Fetch interceptor in `+layout.svelte` maps UI paths → Lambda API Gateway (`ahjoepuw96.execute-api.us-east-1.amazonaws.com`). SvelteKit server routes are dead code.
- **Active work:** Demo readiness — Phases 1-3 complete (bug fixes, endpoint audit, data seeding). Phase 4+ remaining (UI polish, performance, demo script).

## Phase Completion

| Phase                                         | Status                    | Key Deliverables                                                                                                                                                                                |
| --------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–6 — Foundation through Contract Stability   | ✅ Complete               | CF Workers era: workflow durability, auth, MCP orchestration, 35-app marketplace, production hardening, RBAC                                                                                    |
| 7 — Compliance-as-Automation                  | ✅ Complete               | 60 CDT rules, evidence classifier + locker, JML auto-evidence, 40+ control mappings. Policy eval stub remains (parked).                                                                         |
| 7.5 — Scoring Unification                     | ✅ Complete               | Evidence-grounded scores, parseControlRef, adapter pass/fail wired, daily cron re-evaluation                                                                                                    |
| 8 — Access Reviews                            | ✅ Complete               | Campaign CRUD, manager review UI, auto-revoke, evidence per cycle                                                                                                                               |
| **8.5 — AWS Migration**                       | ✅ **Complete** (M1–M7)   | Full re-host: Lambda (7 core + 9 adapter), Aurora PG (35 tables), DynamoDB, S3, SQS, Step Functions, CloudFront + WAF, Route 53. Data migrated. DNS cutover done.                               |
| **9 — Trust Center**                          | ✅ **Complete** (8/8)     | Public route, framework scores, visibility controls, badge SVG, iframe embed, PDF auditor export, Questionnaire AI Lambda port (PR #461), NDA/access-request workflow (PR #470).                |
| **Demo Readiness — Phase 1 (Bug Fixes)**      | ✅ **Complete** (PR #477) | compliance-api prefix strip, settings pathMap + PATCH handler, directory user reconciliation SQL, policy content verification                                                                   |
| **Demo Readiness — Phase 2 (Endpoint Audit)** | ✅ **Complete** (PR #478) | 41+ endpoint audit, MFA uuid::text cast, JML policy column fix, workflow_runs started_at fix, NHI discover GET handler, nhi_credentials display_name fix, dashboard/audit-log pathMap additions |
| **Demo Readiness — Phase 3 (Data Seeding)**   | ✅ **Complete** (PR #479) | Row count audit, compliance pack verification, evidence seeding, automation rule templates, policy seeding from templates                                                                       |
| **Demo Readiness — Phase 4 (UI Shapes)**      | ✅ **Complete** (PR #480) | API response shape fixes for UI components consuming Lambda data                                                                                                                                |

## Lambda Functions (17 deployed)

| Lambda                  | Purpose                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `core-api`              | Tenants, auth, events, flags, credentials, billing, apps, marketplace               |
| `compliance-api`        | Compliance scoring, policy eval, evidence, incidents, notifications, questionnaires |
| `orchestrator`          | Event routing, Step Functions, automation rules, JML, discovery, NHI                |
| `onboarding-api`        | Tenant provisioning                                                                 |
| `scheduler`             | EventBridge-triggered cron duties                                                   |
| `slack-handler`         | Slack notifications + interactive approvals                                         |
| `dlq-processor`         | Dead-letter queue processing                                                        |
| `adapter-github`        | GitHub adapter                                                                      |
| `adapter-okta`          | Okta adapter                                                                        |
| + 7 scaffolded adapters | AWS, Google Workspace, M365, Slack, Jira, Zscaler, BambooHR                         |

## Infrastructure

- **Aurora PG Serverless v2** — primary DB, 35 tables
- **DynamoDB** — sessions, cache, feature flags
- **S3** — evidence, policies, artifacts
- **SQS** — workflow step dispatch
- **CloudFront + WAF** — CDN + 3 managed + 2 rate-limit rules
- **Route 53** — `atlasit.pro` DNS
- **Terraform** — `infra/aws/` (18 files). Legacy `terraform/aws/` frozen.
- **Cost:** ~$14/mo (RDS $3.48, Route 53 $4, NAT $3, WAF $1.78, CW $0.50)

## Stub Endpoints (2 remaining)

- `GET /api/health` — sentinel (intentional)
- `GET /api/marketplace/installs` — derivable from integrations table (low priority)

## Next Up

### Demo Readiness (remaining)

1. **Phase 5 — UI/UX Polish** — dark mode audit, loading states, toast notifications, form validation, responsive layout, empty states, browser console error sweep
2. **Phase 6 — Performance & Reliability** — Lambda cold start measurement, API response times, auth flow E2E, CORS verification, error message cleanup, CloudWatch error metric/alarm, events consumer E2E validation
3. **Phase 7 — Demo Script** — create click-path script with talking points per screen, capture "known good" screenshots, document known limitations

### Post-Demo Strategic

4. Stripe live billing (Phase 7 of plan) — create Stripe prices, wire env vars, E2E test
5. NHI Inventory Dashboard (Phase 10 alpha) — `identity_type` column, risk scoring, dashboard metrics
6. Adapter binding cleanup + CF decommission prep (after 2026-04-25 stability window)
7. Dead SvelteKit server route removal (125 D1-backed `+server.ts` files are dead code)
