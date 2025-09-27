# Deployment Secrets Checklist

This checklist enumerates secrets required for production deployment and recommended storage locations.

Supporting files:

- `.env.example` (root) – master variable template
- `ops/secrets/op-map.json` – 1Password field mapping
- `ops/secrets/op-inject.sh` – local export helper
- `ops/secrets/README.md` – usage & troubleshooting

## Core Platform

- CLOUD_FLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
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

## AI / Orchestration (if applicable)

- OPENAI_API_KEY or TOGETHER_API_KEY
- VECTOR_DB_URL / VECTOR_DB_API_KEY (if using embeddings)

## Operational

- SLACK_WEBHOOK_URL (alerts)
- PAGERDUTY_INTEGRATION_KEY (critical alerts)

## Process

1. Create secrets in GitHub Actions (Repo Settings > Secrets and variables > Actions).
2. Mirror production-only secrets in Cloudflare dashboard (Workers > Settings > Variables & Secrets).
3. For local dev, populate `.env.local` (never commit) referencing sanitized placeholders.
4. Run `wrangler deploy --dry-run` to validate bindings.
5. Execute smoke tests (`ops/checks/dev-smoke.sh`) against staging before prod deploy.

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
