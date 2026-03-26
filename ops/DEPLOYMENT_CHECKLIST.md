> WARNING: ARCHIVED — See ops/PRODUCTION_RUNBOOK.md for current procedures

# AtlasIT Production Deployment Checklist

## Pre-Deployment Requirements

### 1. Environment Validation

```bash
# Verify all required environment variables are set
npm run validate:env

# Run full pre-deployment gate
npm run predeploy
```

### 2. Wrangler Configuration Updates

Current config issues to resolve before deploy:

**Onboarding Worker** (`onboarding/wrangler.toml`):

- ✅ Name: `atlasit-onboarding-dev/staging/prod`
- ❌ Missing `account_id`
- ❌ Test KV/D1 IDs need production values

**AI Orchestrator** (`ai-orchestrator/wrangler.toml`):

- ❌ Name: `ignite-ai-orchestrator` → should be `atlasit-orchestrator`
- ❌ Missing `account_id`
- ❌ Ignite route → needs AtlasIT domain
- ❌ Cron trigger active (consider removing for manual control)

**Documentation Worker** (`documentation-worker/wrangler.toml`):

- ❌ Name: `ignite-documentation` → should be `atlasit-docs`
- ❌ Missing `account_id`
- ❌ Ignite route → needs AtlasIT domain

### 3. Required Secrets (per worker)

Set via `wrangler secret put` in each worker directory:

```bash
# Onboarding Worker
cd onboarding
wrangler secret put ONBOARDING_API_KEY
wrangler secret put API_ALLOWED_KEYS
wrangler secret put RATE_LIMIT_MAX_REQUESTS  # optional
wrangler secret put RATE_LIMIT_WINDOW_SECONDS  # optional

# AI Orchestrator
cd ../ai-orchestrator
wrangler secret put ORCHESTRATOR_API_KEY
wrangler secret put API_ALLOWED_KEYS
wrangler secret put ONBOARDING_API_KEY  # for cross-service calls
wrangler secret put RATE_LIMIT_MAX_REQUESTS
wrangler secret put RATE_LIMIT_WINDOW_SECONDS

# Documentation Worker
cd ../documentation-worker
wrangler secret put API_ALLOWED_KEYS  # if auth added
```

### 4. Production Infrastructure

Ensure Cloudflare resources provisioned:

- [ ] D1 database created and migrated
- [ ] KV namespaces created with production IDs
- [ ] Custom domain configured (if not using workers.dev)
- [ ] Account ID obtained and added to wrangler.toml files

## Deployment Execution

### 1. Deploy Workers (in order)

```bash
# Deploy shared infrastructure first (if any)

# Deploy onboarding worker
cd onboarding
wrangler deploy --env production

# Deploy orchestrator
cd ../ai-orchestrator
wrangler deploy --env production

# Deploy documentation worker
cd ../documentation-worker
wrangler deploy --env production
```

### 2. Verify Deployments

Record deployed URLs in ops/DEPLOYMENT_READINESS_SUMMARY.md:

```bash
# Test health endpoints
curl -H "x-request-id: test-123" https://atlasit-onboarding-prod.workers.dev/health
curl -H "x-request-id: test-456" https://atlasit-orchestrator-prod.workers.dev/health
curl -H "x-request-id: test-789" https://atlasit-docs-prod.workers.dev/health

# Test authenticated endpoints
curl -H "x-api-key: YOUR_API_KEY" -H "x-request-id: auth-test" \
  https://atlasit-orchestrator-prod.workers.dev/status
```

### 3. Post-Deploy Smoke Tests

Run automated smoke tests:

```bash
# After creating scripts/deploy-smoke.mjs
DEPLOYMENT_BASE_URL=https://atlasit-onboarding-prod.workers.dev \
API_KEY=your-key \
node scripts/deploy-smoke.mjs
```

## Security Considerations

### Key Rotation Schedule

- API keys: Rotate monthly
- Service-to-service keys: Rotate quarterly
- Monitor usage in Cloudflare analytics

### Monitoring Setup

- [ ] Configure Cloudflare alerting for 5xx errors
- [ ] Set up latency monitoring (p95 < 500ms target)
- [ ] Enable request sampling for debugging

## Rollback Procedure

In case of issues:

```bash
# Rollback to previous version
cd onboarding && wrangler rollback --env production
cd ../ai-orchestrator && wrangler rollback --env production
cd ../documentation-worker && wrangler rollback --env production
```

## Next Steps Post-Deploy

1. Update DNS/CDN if using custom domain
2. Configure monitoring dashboards
3. Schedule first key rotation
4. Document production URLs in team wiki
5. Plan Durable Object migration for orchestrator workflows

---

**Status**: Draft - Ready for first deployment after wrangler.toml updates
**Last Updated**: 2025-09-27
**Next Review**: After successful first deploy
