# AtlasIT

AtlasIT is a Cloudflare Workers–first platform that automates day-zero onboarding tasks for small and midsize teams. The current stack focuses on three workers that coordinate tenant onboarding flows, AI-assisted orchestration, and lightweight documentation publishing, backed by a shared TypeScript utility package.

## Active Components

- **Onboarding Worker** – Handles `/onboarding/*` APIs, dynamic question generation, and rate-limited, API-key–secured submissions stored in KV/D1.
- **AI Orchestrator Worker** – Brokers task workflows, approval hooks, and rate limiting for internal automation calls.
- **Documentation Worker** – Provides `/health` and `/docs` JSON endpoints as a staging point for published runbooks.
- **Shared Library (`@atlasit/shared`)** – Reusable logging, environment validation, AI helpers, and HTTP utilities consumed by all workers.

## Quick Start

### Prerequisites

- Node.js 18+
- npm (workspace-aware)
- Cloudflare Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers access

### Bootstrap Local Env

```bash
# Clone & install workspace dependencies
npm install

# Copy template env and fill required values
cp .env.example .env

# Validate required vars (uses .env + process env)
npm run validate:env
```

### Run Core Workers

```bash
# Start onboarding + orchestrator in parallel
npm run dev:core

# Or start an individual worker
npm run dev:onboarding
```

Refer to `ops/ENDPOINTS.md` for the list of active routes and authentication notes.

## Testing & Validation

| Command                | Purpose                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `npm run validate:env` | Fails fast if required configuration or secrets are missing.                       |
| `npm run typecheck`    | Strict TypeScript check scoped to active workers and packages.                     |
| `npm run test:unit`    | Executes onboarding, orchestrator, shared, and documentation worker Vitest suites. |
| `npm run predeploy`    | Runs `validate:env`, `typecheck`, and unit tests before deployment.                |

Secret scanning and dependency audits (`npm run scan:secrets`, `npm audit --omit=dev`) complement predeploy checks.

## Deployment (Preview)

1. **Pre-check**

   ```bash
   npm run predeploy
   ```

2. **Seed Secrets** (repeat per worker as needed)

   ```bash
   # Onboarding
   cd onboarding
   wrangler secret put ONBOARDING_API_KEY
   wrangler secret put ORCHESTRATOR_API_KEY   # if orchestrator key shared

   # Orchestrator
   cd ../ai-orchestrator
   wrangler secret put API_ALLOWED_KEYS
   wrangler secret put AI_GATEWAY_TOKEN

   # Documentation worker (optional today)
   cd ../documentation-worker
   wrangler secret put API_ALLOWED_KEYS
   ```

3. **Deploy Workers**

   ```bash
   cd onboarding && wrangler deploy
   cd ../ai-orchestrator && wrangler deploy
   cd ../documentation-worker && wrangler deploy
   ```

4. **Post-Deploy Smoke Tests**

   ```bash
   curl -H "x-api-key: $ONBOARDING_API_KEY" https://<onboarding-domain>/onboarding/start -d '{"industry":"technology"}'
   curl https://<orchestrator-domain>/health
   curl https://<docs-domain>/docs
   ```

See `ops/DEPLOYMENT_READINESS_SUMMARY.md` for the latest validation status and open hardening tasks.

## Documentation

- `ops/ENDPOINTS.md` – Current API catalog for the three workers (docs worker marked experimental).
- `AtlasIT Development Guide.md` – Architecture, repository structure, and development practices.
- `LEGACY.md` – Archived legacy context retained for reference only.

## Future Roadmap (Not Yet Implemented)

- Authentication service (OIDC/SAML/SCIM) to back orchestrated provisioning.
- Marketplace catalog and app onboarding routines.
- API manager gateway consolidation and routing.
- Dashboard/UI refresh for tenant-admin experience.

These items remain deferred until the core workers reach production stability.

## Legacy Notes

Historic pre-refactor automation material has been moved to [`LEGACY.md`](LEGACY.md) and should not be treated as active requirements.

## Contributing

Please open issues or PRs for bug fixes and improvements. Run `npm run predeploy` before submitting changes.

## License

MIT License. See `LICENSE` if provided by the repository owner.
