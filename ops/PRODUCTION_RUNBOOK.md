# AtlasIT Production Runbook

**Authoritative reference for deployment, validation, rollback, and incident response.**
Last updated: 2026-03-16

---

## Table of Contents

1. [Pre-Deploy Checklist](#1-pre-deploy-checklist)
2. [Deploy Sequence](#2-deploy-sequence)
3. [Post-Deploy Validation](#3-post-deploy-validation)
4. [Rollback Procedures](#4-rollback-procedures)
5. [Incident Response](#5-incident-response)
6. [Key Rotation Schedule](#6-key-rotation-schedule)

---

## 1. Pre-Deploy Checklist

Run these steps in order before any production deployment.

### 1.1 Run Tests

```bash
cd /home/andrey_k/Project-AtlasIT
npx vitest run
```

All tests must pass. Do not deploy with failing tests.

### 1.2 Check Pending D1 Migrations

```bash
# List unapplied migrations for core database
wrangler d1 migrations list ATLAS_CORE_DB --env production

# List unapplied migrations for compliance database
wrangler d1 migrations list atlasit_compliance --env production

# List unapplied migrations for audit database
wrangler d1 migrations list atlas_audit_db --env production
```

Note any pending migrations — they must be applied in Step 2 before deploying workers.

### 1.3 Validate Secrets Are Set

Verify each required secret is present in the target worker. A missing secret will cause runtime auth failures.

```bash
# Check which secrets are set (does not reveal values)
cd core-api        && wrangler secret list --env production
cd ../ai-orchestrator && wrangler secret list --env production
cd ../compliance-worker && wrangler secret list --env production
cd ../onboarding   && wrangler secret list --env production
cd ../slack-notification-agent && wrangler secret list --env production
```

Required secrets per worker:

| Worker                   | Required Secrets                                             |
| ------------------------ | ------------------------------------------------------------ |
| core-api                 | `ORCHESTRATOR_API_KEY`, `ONBOARDING_API_KEY`                 |
| ai-orchestrator          | `ORCHESTRATOR_API_KEY`, `ONBOARDING_API_KEY`, `GROQ_API_KEY` |
| compliance-worker        | `GROQ_API_KEY`, `WEBHOOK_SECRET`                             |
| onboarding               | `ONBOARDING_API_KEY`, `API_ALLOWED_KEYS`                     |
| slack-notification-agent | `SLACK_WEBHOOK_URL`, `AGENT_SECRET`                          |

To set a missing secret from 1Password:

```bash
# From the relevant worker directory
op read "op://AWW_SHARED/ONBOARDING_API_KEY/password" | wrangler secret put ONBOARDING_API_KEY --env production
op read "op://AWW_SHARED/ORCHESTRATOR_API_KEY/password" | wrangler secret put ORCHESTRATOR_API_KEY --env production
op read "op://AWW_SHARED/Groq Atlas IT API Credentials/credential" | wrangler secret put GROQ_API_KEY --env production
op read "op://AWW_SHARED/Slack Webhook/url" | wrangler secret put SLACK_WEBHOOK_URL --env production
```

Or use the sync script for all workers at once:

```bash
WRANGLER_ENV=production ./scripts/secrets/op-sync.sh
```

### 1.4 Verify console-app Builds

```bash
cd console-app
pnpm run build
```

The build must complete without errors. Warnings are acceptable.

### 1.5 Verify wrangler Configs

```bash
# Dry-run deploy to validate bindings — does not deploy
cd core-api && wrangler deploy --dry-run --env production
cd ../ai-orchestrator && wrangler deploy --dry-run --env production
cd ../compliance-worker && wrangler deploy --dry-run --env production
cd ../onboarding && wrangler deploy --dry-run --env production
cd ../slack-notification-agent && wrangler deploy --dry-run --env production
```

---

## 2. Deploy Sequence

Deploy in this order. Each step must succeed before proceeding to the next.

### Step 0: Apply D1 Migrations (if any pending)

```bash
cd /home/andrey_k/Project-AtlasIT

# Core DB
wrangler d1 migrations apply ATLAS_CORE_DB --env production

# Compliance DB
wrangler d1 migrations apply atlasit_compliance --env production

# Audit DB
wrangler d1 migrations apply atlas_audit_db --env production
```

Verify schema after applying:

```bash
wrangler d1 execute ATLAS_CORE_DB --env production --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### Step 1: Deploy Shared Packages (if changed)

```bash
cd /home/andrey_k/Project-AtlasIT
pnpm run build --filter=packages/shared
pnpm run build --filter=packages/mcp-sdk
```

Only rebuild packages that have changed since last deploy.

### Step 2: Deploy core-api

```bash
cd /home/andrey_k/Project-AtlasIT/core-api
wrangler deploy --env production
```

Smoke test before proceeding:

```bash
curl -sf https://api.atlasit.pro/api/health | jq .
```

Expected: `{"status":"ok"}` or `{"status":"healthy"}` with HTTP 200.

### Step 3: Deploy ai-orchestrator

```bash
cd /home/andrey_k/Project-AtlasIT/ai-orchestrator
wrangler deploy --env production
```

Smoke test:

```bash
curl -sf https://orchestrator.atlasit.pro/health | jq .
# Authenticated check
curl -sf -H "x-api-key: $(op read 'op://AWW_SHARED/ORCHESTRATOR_API_KEY/password')" \
  https://orchestrator.atlasit.pro/status | jq .
```

### Step 4: Deploy compliance-worker

```bash
cd /home/andrey_k/Project-AtlasIT/compliance-worker
wrangler deploy --env production
```

Smoke test:

```bash
curl -sf https://compliance.atlasit.pro/health | jq .
```

### Step 5: Deploy onboarding

```bash
cd /home/andrey_k/Project-AtlasIT/onboarding
wrangler deploy --env production
```

Smoke test:

```bash
curl -sf https://atlasit-onboarding-prod.workers.dev/health | jq .
```

### Step 6: Deploy slack-notification-agent

```bash
cd /home/andrey_k/Project-AtlasIT/slack-notification-agent
wrangler deploy --env production
```

No public health endpoint. Verify deployment success from `wrangler deploy` output.

### Step 7: Deploy console-app

```bash
cd /home/andrey_k/Project-AtlasIT/console-app
npx wrangler pages deploy .svelte-kit/cloudflare --project-name atlasit-console
```

Smoke test:

```bash
curl -sf -o /dev/null -w "%{http_code}" https://console.atlasit.pro/
# Expected: 200 or 302 (redirect to login)
```

---

## 3. Post-Deploy Validation

### 3.1 Health Check All Endpoints

```bash
#!/usr/bin/env bash
# Run after all workers are deployed
set -euo pipefail

ENDPOINTS=(
  "https://api.atlasit.pro/api/health"
  "https://orchestrator.atlasit.pro/health"
  "https://compliance.atlasit.pro/health"
  "https://atlasit-onboarding-prod.workers.dev/health"
)

for url in "${ENDPOINTS[@]}"; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "ERR")
  echo "$status  $url"
done
```

All must return 200. Any non-200 is a deployment failure — initiate rollback.

### 3.2 Verify D1 Schema Matches Expectations

```bash
# Confirm core tables exist
wrangler d1 execute ATLAS_CORE_DB --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Quick row-count sanity check
wrangler d1 execute ATLAS_CORE_DB --env production \
  --command "SELECT 'tenants' AS tbl, COUNT(*) AS rows FROM tenants UNION ALL
             SELECT 'users', COUNT(*) FROM users;"
```

### 3.3 Check Logs in Cloudflare Dashboard

1. Open [Cloudflare Workers Dashboard](https://dash.cloudflare.com) → Workers & Pages.
2. For each deployed worker, open → Logs → Live (or Logs Tail via CLI):

```bash
# Stream logs from a worker for 60 seconds
wrangler tail atlasit-core-api --env production --format pretty
wrangler tail atlasit-ai-orchestrator --env production --format pretty
```

Look for: 5xx errors, authentication failures, missing binding errors.

### 3.4 Verify Inter-Worker Communication

```bash
# Trigger a test event through the orchestrator to verify routing to compliance-worker
curl -sf \
  -H "x-api-key: $(op read 'op://AWW_SHARED/ORCHESTRATOR_API_KEY/password')" \
  -H "Content-Type: application/json" \
  -d '{"event":"health_check","tenant_id":"test"}' \
  https://orchestrator.atlasit.pro/events | jq .
```

---

## 4. Rollback Procedures

### 4.1 Wrangler Worker Rollback

Cloudflare retains the previous deployment. Roll back immediately if a worker is broken.

```bash
# Roll back to previous deployment for a specific worker
cd /home/andrey_k/Project-AtlasIT/core-api
wrangler rollback --env production

# Repeat for each affected worker
cd ../ai-orchestrator && wrangler rollback --env production
cd ../compliance-worker && wrangler rollback --env production
cd ../onboarding && wrangler rollback --env production
cd ../slack-notification-agent && wrangler rollback --env production
```

Verify rollback:

```bash
curl -sf https://api.atlasit.pro/api/health | jq .
```

### 4.2 D1 Database Rollback (Time Travel)

Cloudflare D1 Time Travel retains point-in-time restore up to 30 days.

```bash
# List available restore points
wrangler d1 time-travel info ATLAS_CORE_DB --env production

# Restore to a specific timestamp (ISO 8601)
wrangler d1 time-travel restore ATLAS_CORE_DB \
  --env production \
  --timestamp "2026-03-15T12:00:00Z"
```

**Warning**: D1 Time Travel restore is destructive — it replaces the current state. Only use after confirming the migration cannot be reversed manually.

For schema-only rollback (preferred when possible):

```bash
# Write and apply a reverse migration manually
wrangler d1 execute ATLAS_CORE_DB --env production --file migrations/rollback-v<N>.sql
```

### 4.3 console-app Rollback

```bash
# List recent deployments
npx wrangler pages deployment list --project-name atlasit-console

# Rollback to a specific deployment ID
npx wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name atlasit-console
```

### 4.4 Emergency Contacts and Escalation

| Role               | Contact                             | When to Escalate       |
| ------------------ | ----------------------------------- | ---------------------- |
| On-call Engineer   | GitHub: @JW-Flo                     | P1/P2 incidents        |
| Cloudflare Support | https://dash.cloudflare.com/support | Platform-level outages |

Escalation path: Engineer → Cloudflare Support (if platform issue) → Stakeholders.

---

## 5. Incident Response

### 5.1 Severity Levels

| Level | Definition                                    | Response Time     | Example                                                 |
| ----- | --------------------------------------------- | ----------------- | ------------------------------------------------------- |
| P1    | Complete platform outage or data loss         | 15 minutes        | All workers returning 5xx, D1 unavailable               |
| P2    | Major feature broken, significant user impact | 1 hour            | Auth failure, compliance scoring broken                 |
| P3    | Minor feature degraded, workaround exists     | 4 hours           | Slack notifications failing, non-critical endpoint slow |
| P4    | Cosmetic or low-impact issue                  | Next business day | UI rendering glitch, log noise                          |

### 5.2 Response Steps

**P1/P2:**

1. **Acknowledge** — post in #incidents Slack channel within response SLA.
2. **Assess** — check Cloudflare dashboard for error rate spikes and tail logs:
   ```bash
   wrangler tail atlasit-core-api --env production --format pretty
   ```
3. **Contain** — if caused by a bad deploy, roll back immediately (see Section 4).
4. **Communicate** — update #incidents every 15 minutes (P1) or 30 minutes (P2).
5. **Resolve** — confirm health checks pass.
6. **Post-incident** — file a PIR (see template below) within 48 hours.

**P3/P4:**

1. Log the issue in GitHub Issues with the `incident` label.
2. Assign to current sprint.
3. No immediate Slack required unless it escalates.

### 5.3 Communication Template

```
INCIDENT [P<N>] — <Short title>

Status: [Investigating | Identified | Monitoring | Resolved]
Started: <ISO 8601 timestamp>
Affected: <workers or features affected>

Impact:
<What is broken and who is affected>

Current actions:
<What is being done right now>

Next update: <timestamp>
```

### 5.4 Post-Incident Review (PIR) Template

File within 48 hours of P1/P2 resolution. Create as `ops/incidents/PIR-YYYY-MM-DD-<slug>.md`.

```markdown
# PIR: <Title>

Date: YYYY-MM-DD
Severity: P<N>
Duration: X hours Y minutes
Author: <name>

## Timeline

- HH:MM — <event>
- HH:MM — <event>

## Root Cause

<What caused the incident>

## Contributing Factors

<What made it worse or harder to detect>

## Resolution

<What fixed it>

## Action Items

| Action | Owner  | Due        |
| ------ | ------ | ---------- |
| <fix>  | <name> | YYYY-MM-DD |

## What Went Well

-

## What Could Be Improved

-
```

---

## 6. Key Rotation Schedule

Use `scripts/rotate-secrets.sh` for automated rotation. Always verify the script in `--dry-run` first.

```bash
# Preview what would change
./scripts/rotate-secrets.sh --dry-run

# Rotate all targets
./scripts/rotate-secrets.sh

# Rotate secrets for a single worker
./scripts/rotate-secrets.sh --worker ai-orchestrator
```

Rotation log is written to `ops/rotation-log.jsonl`.

### Schedule

| Secret                                | Rotation Interval         | Next Action                                                                |
| ------------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `ONBOARDING_API_KEY`                  | Monthly                   | Generate new via `openssl rand -hex 24`, update 1Password, push to workers |
| `ORCHESTRATOR_API_KEY`                | Monthly                   | Generate new via `openssl rand -hex 24`, update 1Password, push to workers |
| `GROQ_API_KEY`                        | Monthly                   | Rotate in Groq dashboard, update 1Password, re-sync to workers             |
| `SLACK_WEBHOOK_URL`                   | As needed (on compromise) | Regenerate in Slack app settings, update 1Password                         |
| `CF_API_TOKEN` (Cloudflare API Token) | 90 days                   | Rotate in Cloudflare dashboard, update 1Password                           |
| `OKTA_CLIENT_SECRET`                  | 180 days                  | Rotate in Okta app integration, update 1Password                           |
| `R2_SECRET_ACCESS_KEY`                | 180 days                  | Rotate in Cloudflare R2 settings, update 1Password                         |
| `WEBHOOK_SECRET` (compliance-worker)  | Quarterly                 | Generate new, update 1Password, push to worker                             |

### Post-Rotation Verification

After each rotation, run a smoke test on affected workers:

```bash
# Verify workers still authenticate after key rotation
curl -sf https://api.atlasit.pro/api/health | jq .
curl -sf https://orchestrator.atlasit.pro/health | jq .
curl -sf https://compliance.atlasit.pro/health | jq .
```

If health checks fail after rotation, check that `API_ALLOWED_KEYS` on consuming workers was updated to include the new key values.

---

_This runbook supersedes `ops/DEPLOYMENT_CHECKLIST.md` and `ops/DEPLOYMENT_SECRETS_CHECKLIST.md`._
