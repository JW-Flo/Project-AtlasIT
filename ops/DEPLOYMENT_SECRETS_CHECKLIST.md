# Deployment Secrets Checklist

This checklist enumerates secrets required for production deployment and recommended storage locations.

Supporting files:

- `.env.example` (root) – master variable template
- `ops/secrets/op-map.json` – 1Password field mapping
- `ops/secrets/op-inject.sh` – local export helper
- `ops/secrets/README.md` – usage & troubleshooting
- `atlasit/RUNBOOKS/AGENT_OPS.md` – agent operational guidelines including credential sync

## Core Platform

- CLOUDFLARE_API_TOKEN (preferred) / CF_API_TOKEN (legacy fallback)
- CF_ACCOUNT_ID
- D1_DATABASE_ID
- R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
- KV_NAMESPACE_ID (auth/session)
- ANALYTICS_ENGINE_DATASET

## Authentication / IdP

- OKTA_CLIENT_ID
- OKTA_CLIENT_SECRET
- OKTA_DOMAIN
- FEATURE_IDP_OKTA=1 (flag enable)

## Security & Telemetry

- SENTRY_DSN (optional)
- DATADOG_API_KEY (optional)
- LOG_LEVEL (info|debug|warn|error)

## Build / CI

- NPM_TOKEN (if private packages)
- GH_TOKEN (release automation)

### CI Environment Variables

For validation-only CI workflows (lint, test, build without deploy), use dummy credentials:

```yaml
env:
  # Cloudflare platform credentials (dummy values for CI validation)
  CF_ACCOUNT_ID: dummy-cf-account-id-ci
  CLOUDFLARE_API_TOKEN: dummy-cloudflare-api-token-ci
  D1_DATABASE: ATLAS_ONBOARDING_DB
  KV_NAMESPACE: atlasit_kv
  R2_BUCKET: atlasit-evidence
  # Service API keys (dummy values for CI validation)
  ONBOARDING_API_KEY: dummy-onboarding-ci
  ORCHESTRATOR_API_KEY: dummy-orchestrator-ci
```

For deployment workflows, use real GitHub Secrets:

```yaml
env:
  CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  WRANGLER_API_TOKEN: ${{ secrets.WRANGLER_API_TOKEN }}
```

**Required GitHub Secrets for deployments:**
- `CF_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` or `WRANGLER_API_TOKEN` - Cloudflare API token with Workers + KV + D1 + R2 permissions

## AI / Orchestration (if applicable)

- OPENAI_API_KEY or TOGETHER_API_KEY
- VECTOR_DB_URL / VECTOR_DB_API_KEY (if using embeddings)

## Operational

- SLACK_WEBHOOK_URL (alerts)
- PAGERDUTY_INTEGRATION_KEY (critical alerts)

## Service API Keys (AtlasIT Specific)

**Generation Example:**

```bash
# Generate 24-byte hex keys for service authentication
openssl rand -hex 24  # Use output for ONBOARDING_API_KEY
openssl rand -hex 24  # Use output for ORCHESTRATOR_API_KEY
```

**Required Per Worker:**

- **ONBOARDING_API_KEY** – Authentication for onboarding service endpoints
- **ORCHESTRATOR_API_KEY** – Authentication for orchestrator service endpoints
- **API_ALLOWED_KEYS** – Comma-separated list of valid API keys (include both above keys)

**Wrangler Secret Commands:**

```bash
# Set secrets per worker (run from each worker directory)
cd onboarding
wrangler secret put ONBOARDING_API_KEY
wrangler secret put API_ALLOWED_KEYS
wrangler secret put RATE_LIMIT_MAX_REQUESTS  # optional: "100"
wrangler secret put RATE_LIMIT_WINDOW_SECONDS  # optional: "3600"

cd ../ai-orchestrator
wrangler secret put ORCHESTRATOR_API_KEY
wrangler secret put API_ALLOWED_KEYS
wrangler secret put ONBOARDING_API_KEY  # for cross-service calls
wrangler secret put RATE_LIMIT_MAX_REQUESTS
wrangler secret put RATE_LIMIT_WINDOW_SECONDS

cd ../documentation-worker
wrangler secret put API_ALLOWED_KEYS  # if auth enabled
```

**Key Rotation Schedule:**

- Monthly: Service API keys
- Quarterly: Cross-service keys
- As-needed: Rate limit configs

**Validation:**

```bash
# Verify environment meets requirements before deployment
npm run validate:env
```

## Process

1. Create secrets in GitHub Actions (Repo Settings > Secrets and variables > Actions).
2. Mirror production-only secrets in Cloudflare dashboard (Workers > Settings > Variables & Secrets).
3. Record final values in 1Password using the field map in `ops/secrets/op-map.json` (invoked via `ops/secrets/op-inject.sh`).
4. For local dev, populate `.env.local` (never commit) referencing sanitized placeholders.
5. Run `npm run validate:env` before commits or deploys to fail fast on missing configuration.
6. Run `wrangler deploy --dry-run` to validate bindings.
7. Execute smoke tests (`ops/checks/dev-smoke.sh`) against staging before prod deploy.

## Secret Creation Tips

- Generate 24-byte service keys with `openssl rand -hex 24` before storing in 1Password.
- Map each generated key to the appropriate vault field using `ops/secrets/op-map.json` to enable scripted injection.

## Validation Command Examples

```bash
wrangler whoami
wrangler d1 execute $D1_DATABASE_ID --command 'SELECT 1;'
```

## Rotation Policy

| Secret               | Rotation Interval | Notes                                            |
| -------------------- | ----------------- | ------------------------------------------------ |
| Cloudflare API Token | 90d               | Principle of least privilege (Workers + KV + D1) |
| Okta Client Secret   | 180d              | Rotate before expiry, update app integration     |
| R2 Keys              | 180d              | Use access tokens scoped to bucket               |

Update this file when new subsystems are added.
