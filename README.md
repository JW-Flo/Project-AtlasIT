# AtlasIT

Multi-tenant IT automation and compliance platform. AWS-native backend (Lambda + Aurora PG + DynamoDB + S3 + SQS), SvelteKit console on AWS.

> **Migration status:** Phase 8.5 complete — 7 Lambda functions ported, Aurora schema live, Terraform infrastructure deployed. Phase 8.5a (route completion) in progress; staging validation and DNS cutover pending.

## Architecture

### Backend (AWS Lambda)

| Lambda           | Path                      | Purpose                                                            |
| ---------------- | ------------------------- | ------------------------------------------------------------------ |
| `core-api`       | `lambdas/core-api/`       | Central API: tenants, events, agents, flags, credentials           |
| `compliance-api` | `lambdas/compliance-api/` | Compliance scoring, policy evaluation, evidence                    |
| `orchestrator`   | `lambdas/orchestrator/`   | Event routing, workflow execution (Step Functions), queue consumer |
| `onboarding-api` | `lambdas/onboarding-api/` | Tenant provisioning                                                |
| `scheduler`      | `lambdas/scheduler/`      | Cron-based scheduled task execution                                |
| `slack-handler`  | `lambdas/slack-handler/`  | Slack notifications + interactive approval workflows               |
| `dlq-processor`  | `lambdas/dlq-processor/`  | Dead-letter queue processing                                       |

### Frontend

| Component      | Path                    | Runtime                 | Purpose                                                |
| -------------- | ----------------------- | ----------------------- | ------------------------------------------------------ |
| Console App    | `console-app/`          | S3 + CloudFront         | Compliance, directory, marketplace, workflows, billing |
| Marketing Site | `apps/atlasit-web/`     | S3 + CloudFront         | Public marketing + landing                             |
| Docs           | `documentation-worker/` | Lambda + API Gateway (legacy path name) | docs.atlasit.pro                                       |

### Shared Packages

| Package           | Path                         | Purpose                                                               |
| ----------------- | ---------------------------- | --------------------------------------------------------------------- |
| Shared Library    | `packages/shared/`           | Types, auth, platform AWS SDK (DynamoDB/S3/SQS/PG), automation engine |
| MCP SDK           | `packages/mcp-sdk/`          | MCP agent SDK (client + server, HMAC signing)                         |
| Connector Schema  | `packages/connector-schema/` | ConnectorManifest Zod schemas + templates (35 apps)                   |
| Adapter Generator | `packages/adapter-gen/`      | Manifest JSON → full adapter scaffold                                 |

### Adapters

35 adapters in `adapters/` — 9 core-tier hand-written (GitHub, Okta, Slack, Microsoft 365, AWS, Google Workspace, Zscaler, etc.), 24 scaffolded via `adapter-gen`, deployed on AWS Lambda.

### Infrastructure

Terraform in `terraform/aws/` — 19+ files covering:

- VPC, subnets, security groups
- API Gateway (HTTP API) → Lambda
- Aurora PostgreSQL Serverless v2 (primary DB)
- DynamoDB (sessions, cache, feature flags)
- S3 (evidence, artifacts)
- SQS (workflow step dispatch)
- Step Functions (JML + automation rule state machines)
- CloudFront + WAF
- Route 53, ACM, SSM Parameter Store, Secrets Manager

Terraform state: S3 bucket `atlasit-terraform-state-457335975503` + DynamoDB lock `atlasit-terraform-locks`.

## Storage

| Store     | Service     | Binding / Name                                         | Purpose                                                  |
| --------- | ----------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Aurora PG | AWS RDS     | `atlasit-db`                                           | Tenants, users, compliance, directory, audit (35 tables) |
| DynamoDB  | AWS         | `atlasit-sessions` / `atlasit-cache` / `atlasit-flags` | Sessions, cache, feature flags                           |
| S3        | AWS         | `atlasit-evidence-*`                                   | Policies, evidence, artifacts                            |
| SQS       | AWS         | `atlasit-step-tasks`                                   | Workflow step dispatch                                   |
| Legacy session/cache/flags store | Legacy edge | Deprecated: `KV_SESSIONS`, `KV_CACHE`, `KV_FEATURE_FLAGS` | Migrated to DynamoDB session/cache/flag tables |
| Legacy relational store | Legacy edge | Deprecated: `ATLAS_SHARED_DB` | Migrated to Aurora PG (`atlasit-db`) |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`corepack enable`)
- AWS CLI v2 (`aws --version`)
- Terraform 1.6+ (`terraform --version`)
- AWS SAM CLI (optional for local Lambda workflows)

### Install & Run

```bash
pnpm install                  # Install all workspace deps

# Build shared package first (required by lambdas + console)
cd packages/shared && pnpm run build && cd ../..

pnpm run dev:console          # SvelteKit console app (localhost:5173)
```

### Local Lambda dev

```bash
cd lambdas/core-api
pnpm install
pnpm run dev                  # SAM local or esbuild watch
```

### Infrastructure

```bash
cd terraform/aws
terraform init
terraform workspace select staging   # or default
terraform plan
terraform apply
```

## Console App Features

- **Compliance Manager** — SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR; control status, weighted A–F scoring, evidence guidance, history
- **Directory Sync** — IdP-synced user/group directory, auto-suggested group-to-app mappings
- **Marketplace** — 35 integrations across 7 categories, credential vault, connection testing
- **Workflows** — JML (Joiner/Mover/Leaver) workflow builder + executor backed by Step Functions
- **Automation Engine** — Rule-based automation with NL builder, compliance mapping, simulation
- **Policy Generator** — AI-powered compliance policy document generation
- **Analytics Dashboard** — Compliance trends, risk metrics, operational insights
- **Incidents & Access Reviews** — CRUD lifecycle, campaign manager, auto-revoke
- **Billing** — Stripe-integrated tier gating (Free / Starter / Professional / Enterprise)
- **Admin Panel** — Super-admin tenant management, impersonation (15 min TTL)
- **Support** — Contact form, Terms of Service, Privacy Policy, DSAR tracking

## Testing & CI/CD

```bash
pnpm run test:unit            # Vitest (719 tests across 118 files)
pnpm run typecheck            # Strict TypeScript
pnpm run lint                 # ESLint
pnpm run predeploy            # typecheck + tests + lint
pnpm run test:pw              # Playwright smoke tests
```

### Deploy

**Lambda + Infrastructure:** Terraform via GitHub Actions on push to `main`. AWS credentials injected via OIDC (no static keys in CI).

**Console App / Frontend:** `.github/workflows/deploy-on-merge.yml` — detects changed paths, applies migrations if needed, deploys affected AWS services, runs smoke tests.

Manual deploy: `workflow_dispatch` on either workflow.

Secrets: Lambda env vars via SSM Parameter Store (`/atlasit/<env>/<key>`) and AWS Secrets Manager.

## Live Endpoints

| Service   | URL                                           |
| --------- | --------------------------------------------- |
| Console   | https://www.atlasit.pro                       |
| Docs      | https://docs.atlasit.pro                      |
| Status    | https://status.atlasit.pro                    |
| API (AWS) | https://api.atlasit.pro (pending DNS cutover) |

## AWS Account

- Account: `457335975503`, region `us-east-1`
- AWS CLI: `aws` (Linux/CI) or `"C:/Program Files/Amazon/AWSCLIV2/aws.exe"` (Windows)

## Contributing

Run `pnpm run predeploy` before submitting changes. See `ROADMAP.md` for migration phases and `STATUS.md` for current completion state.

## License

MIT
