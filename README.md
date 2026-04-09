# AtlasIT

Multi-tenant IT automation and compliance platform, deployed on Cloudflare.

## Architecture

### Core Services

| Component              | Path                        | Runtime            | Purpose                                                  |
| ---------------------- | --------------------------- | ------------------ | -------------------------------------------------------- |
| Console App            | `console-app/`              | CF Pages (SvelteKit) | Primary UI: compliance, directory, marketplace, workflows |
| Core API               | `core-api/`                 | CF Worker (Hono)   | Central API: tenants, events, agents, flags, credentials |
| Compliance Worker      | `compliance-worker/`        | CF Worker          | Evidence-grounded compliance scoring, policy evaluation   |
| AI Orchestrator        | `ai-orchestrator/`          | CF Worker          | Event routing, workflow execution, queue consumer, cron   |
| Dispatch Worker        | `dispatch-worker/`          | CF Worker          | Queue-driven workflow step dispatch                      |
| Onboarding             | `onboarding/`               | CF Worker          | Tenant provisioning                                      |
| Documentation Worker   | `documentation-worker/`     | CF Worker (Hono)   | docs.atlasit.pro — API/product documentation             |
| Email Worker           | `email-worker/`             | CF Worker          | Transactional email (support@atlasit.pro)                |
| Apex Redirect          | `apex-redirect-worker/`     | CF Worker          | Root domain + status.atlasit.pro redirects               |
| Scheduler Worker       | `scheduler-worker/`         | CF Worker          | Cron-based scheduled task execution                      |
| Marketplace            | `marketplace/`              | CF Worker          | App catalog, install/uninstall management                |
| Slack Notification     | `slack-notification-agent/` | CF Worker          | Outbound Slack MCP agent                                 |
| Slack Approval         | `slack-approval-worker/`    | CF Worker          | Slack interactive approval workflows                     |

### Shared Packages

| Package            | Path                       | Purpose                                            |
| ------------------ | -------------------------- | -------------------------------------------------- |
| Shared Library     | `packages/shared/`         | Types, auth, logging, middleware, automation engine |
| MCP SDK            | `packages/mcp-sdk/`        | MCP agent SDK (client + server, HMAC signing)      |
| Connector Schema   | `packages/connector-schema/` | ConnectorManifest Zod schemas + templates (35 apps) |
| Adapter Generator  | `packages/adapter-gen/`    | Manifest JSON → full CF Worker scaffold            |

### Adapters

9 core-tier hand-written adapters in `adapters/` (GitHub, Okta, Slack, Microsoft 365, AWS, Google Workspace, Zscaler + more), plus 24 scaffolded adapters generated via `adapter-gen`.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`corepack enable`)
- Wrangler CLI (`pnpm add -g wrangler`)
- Cloudflare account with Workers, D1, KV, R2, and Queues access

### Install & Run

```bash
pnpm install                  # Install all workspace deps
cp .env.example .env          # Copy and fill required values

pnpm run dev:console          # SvelteKit console app (localhost:5173)
pnpm run dev:core             # Workers locally
pnpm run dev:orchestrator     # AI orchestrator locally
pnpm run dev:compliance       # Compliance worker locally
```

## Console App Features

- **Compliance Manager** — Framework tracking (SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR), control status with collapsible rows, weighted scoring with A–F grades, evidence guidance, compliance history
- **Directory Sync** — IdP-synced user/group directory with auto-suggested group-to-app mappings
- **Marketplace** — Integration catalog (35 apps across 7 categories) with credential management and connection testing
- **Workflows** — JML (Joiner/Mover/Leaver) workflow builder and executor
- **Automation Engine** — Rule-based automation with natural language builder, compliance mapping, and simulation
- **Policy Generator** — AI-powered compliance policy document generation
- **Analytics Dashboard** — Compliance trends, risk metrics, and operational insights
- **Incidents & Access Requests** — CRUD and lifecycle management
- **Notifications** — Bell icon with unread count, mark-read
- **Admin Panel** — Super-admin tenant management, impersonation (15min TTL)
- **Billing** — Stripe-integrated tier gating (Free/Starter/Professional/Enterprise)
- **Support** — Contact form, Terms of Service, Privacy Policy with DSAR request tracking

## Storage & Bindings

| Type   | Binding            | Purpose                                               |
| ------ | ------------------ | ----------------------------------------------------- |
| D1     | `ATLAS_SHARED_DB`  | Tenants, users, preferences, directory, compliance, audit |
| KV     | `KV_SESSIONS`      | Session storage                                       |
| KV     | `KV_CACHE`         | General cache (compliance scores, API responses)      |
| KV     | `KV_FEATURE_FLAGS` | Feature flags (rollout %, tenant overrides)            |
| KV     | `MCP_STORE`        | MCP agent state and configuration                     |
| R2     | `atlasit-evidence` | Policies, evidence, artifacts                         |
| Queues | `atlasit-step-tasks` | Workflow step dispatch                              |

## Testing & CI/CD

```bash
pnpm run test:unit            # Vitest suites
pnpm run typecheck            # Strict TypeScript check
pnpm run lint                 # ESLint
pnpm run predeploy            # Full pre-deploy checks (typecheck + tests)
pnpm run test:pw              # Playwright smoke tests
```

### Deploy

All deploys run automatically via **`.github/workflows/deploy-on-merge.yml`** on push to `main`. The workflow:

1. Detects changed paths per worker
2. Applies D1 migrations if needed
3. Deploys only affected workers
4. Runs smoke tests against production endpoints

Manual deploy via `workflow_dispatch` is also available.

Secrets are managed via `wrangler secret put <KEY>` per worker.

## Live Endpoints

| Service       | URL                          |
| ------------- | ---------------------------- |
| Console       | https://www.atlasit.pro      |
| Docs          | https://docs.atlasit.pro     |
| Support       | https://www.atlasit.pro/support |
| Status        | https://status.atlasit.pro   |

## Environment Variables

Copy `.env.example` to `.env` and fill in required values. Worker secrets (API keys, tokens) are set via `wrangler secret put` and should never be committed.

## Contributing

Open issues or PRs for bug fixes and improvements. Run `pnpm run predeploy` before submitting changes.

## License

MIT
