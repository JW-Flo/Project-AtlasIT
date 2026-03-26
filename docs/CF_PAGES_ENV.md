# Cloudflare Pages/Workers Dev Environment

This document lists the environment variables and bindings required for the AtlasIT dev deployment. Do not commit secrets.

## Bindings

- KV: ATLAS_FLAGS (feature flags)
- D1: ATLAS_D1 (database: atlasit_dev)
- R2: ATLAS_R2 (bucket: atlasit-evidence-dev)
- DO: ORCHESTRATOR_DO (class: OrchestratorDO)
- Dispatch namespace: dispatcher (namespace: atlasit-dispatcher)

## Variables/Secrets (dev)

- AWS_ENABLED = 0
- S3_MIRROR = 0

Set secrets via:

```bash
wrangler secret put AWS_ENABLED   # enter 0
wrangler secret put S3_MIRROR     # enter 0
```

## Cron (dev only)

- \*/30 \* \* \* \* (sweep)
- 15 \*/2 \* \* \* (replay)

Adjust wrangler.toml if schedules change.
