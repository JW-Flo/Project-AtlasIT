# AtlasIT Platform Status

**Last updated:** 2026-04-15

## Current State

- **Platform:** AWS-native (Lambda + Aurora PG + DynamoDB + S3 + SQS). Migration gate PASSED 2026-04-12. Stability window active until 2026-04-25.
- **Package manager:** pnpm (workspace monorepo)
- **Console app:** SvelteKit on CF Pages — CF decommission deferred until 2026-04-25 stability window closes
- **Active work:** Phase 9 (Trust Center — 6/8 shipped), observability hardening, Stripe live billing

## Phase Completion

| Phase                                       | Status                  | Key Deliverables                                                                                                                                                                 |
| ------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–6 — Foundation through Contract Stability | ✅ Complete             | CF Workers era: workflow durability, auth, MCP orchestration, 35-app marketplace, production hardening, RBAC                                                                     |
| 7 — Compliance-as-Automation                | ✅ Complete             | 60 CDT rules, evidence classifier + locker, JML auto-evidence, 40+ control mappings. Policy eval stub remains (parked).                                                          |
| 7.5 — Scoring Unification                   | ✅ Complete             | Evidence-grounded scores, parseControlRef, adapter pass/fail wired, daily cron re-evaluation                                                                                     |
| 8 — Access Reviews                          | ✅ Complete             | Campaign CRUD, manager review UI, auto-revoke, evidence per cycle                                                                                                                |
| **8.5 — AWS Migration**                     | ✅ **Complete** (M1–M7) | Full re-host: Lambda (7 core + 9 adapter), Aurora PG (35 tables), DynamoDB, S3, SQS, Step Functions, CloudFront + WAF, Route 53. Data migrated. DNS cutover done.                |
| **9 — Trust Center**                        | ✅ **Complete** (8/8)   | Public route, framework scores, visibility controls, badge SVG, iframe embed, PDF auditor export, Questionnaire AI Lambda port (PR #461), NDA/access-request workflow (PR #470). |

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

See ROADMAP.md "Next Up" section for ranked backlog. Top items:

1. NHI Inventory Dashboard (Phase 10 — ~2 days)
2. Events consumer end-to-end validation (~2 hr)
3. Stripe live billing — run `terraform apply infra/aws/` then `ENV=dev ./scripts/update-lambda-stripe-env.sh`
4. Console-app questionnaire routes migration (still D1-backed, should proxy to Lambda)
5. CF decommission after 2026-04-25 stability window closes
