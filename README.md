# AtlasIT

Multi-tenant IT automation and compliance platform, deployed on Cloudflare.

## Architecture

| Component         | Path                 | Runtime                                 | Purpose                                                |
| ----------------- | -------------------- | --------------------------------------- | ------------------------------------------------------ |
| Console App       | `console-app/`       | Cloudflare Pages (SvelteKit + Tailwind) | Primary user-facing application                        |
| Compliance Worker | `compliance-worker/` | Cloudflare Worker                       | Compliance scoring, evidence hashing, policy rendering |
| AI Orchestrator   | `ai-orchestrator/`   | Cloudflare Worker                       | Task submission, cron execution, workflow engine       |
| Onboarding Worker | `onboarding/`        | Cloudflare Worker                       | Tenant provisioning flows                              |
| Shared Library    | `packages/shared/`   | npm package                             | Common types, auth utilities, logging                  |

## Quick Start

### Prerequisites

- Node.js 18+
- npm (workspace-aware)
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers, D1, KV, and R2 access

### Install & Run

```bash
npm install              # Install all workspace deps
cp .env.example .env     # Copy and fill required values

npm run dev:console      # SvelteKit console app (localhost:5173)
npm run dev:core         # Workers locally
```

## Console App Features

- **Tenant Onboarding** -- 6-step wizard: org details, owner account, framework selection, IdP connection, app selection, review
- **Compliance Manager** -- Framework tracking (SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR), control status, weighted scoring with A-F grades, compliance history
- **Directory Sync** -- IdP-synced user/group directory with auto-suggested group-to-app mappings
- **Marketplace** -- Integration catalog (24 apps across 7 categories) with credential management and connection testing
- **Workflows** -- JML (Joiner/Mover/Leaver) workflow builder and executor
- **Policy Generator** -- AI-powered compliance policy document generation
- **Incidents & Access Requests** -- CRUD and lifecycle management
- **Notifications** -- Bell icon with unread count, mark-read
- **Admin Panel** -- Super-admin tenant management, impersonation (15min TTL)

## Storage & Bindings

| Type | Binding            | Purpose                                                                       |
| ---- | ------------------ | ----------------------------------------------------------------------------- |
| D1   | `ATLAS_SHARED_DB`  | Tenants, users, preferences, directory, compliance scores/history, audit logs |
| KV   | `KV_SESSIONS`      | Session storage                                                               |
| KV   | `KV_CACHE`         | General cache                                                                 |
| KV   | `KV_FEATURE_FLAGS` | Feature flag state                                                            |
| R2   | `atlas_policies`   | Generated policy documents                                                    |
| R2   | `atlas_evidence`   | Compliance evidence files                                                     |
| R2   | `atlas_artifacts`  | Build and export artifacts                                                    |

## Testing & Deployment

| Command               | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `npm run test:unit`   | Run all Vitest suites                      |
| `npm run typecheck`   | Strict TypeScript check                    |
| `npm run predeploy`   | Full pre-deploy checks (typecheck + tests) |
| `npm run dev:console` | Local SvelteKit dev server                 |
| `npm run dev:core`    | Local workers dev server                   |

### Deploy

```bash
npm run predeploy                        # Verify before deploying
cd console-app && npx wrangler pages deploy
cd ai-orchestrator && wrangler deploy
cd compliance-worker && wrangler deploy
cd onboarding && wrangler deploy
```

Secrets are managed via `wrangler secret put <KEY>` per worker.

## Environment Variables

Copy `.env.example` to `.env` and fill in required values. Worker secrets (API keys, tokens) are set via `wrangler secret put` and should never be committed.

## Contributing

Open issues or PRs for bug fixes and improvements. Run `npm run predeploy` before submitting changes.

## License

MIT
