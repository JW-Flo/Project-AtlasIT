# Deploy AtlasIT to Cloudflare (dev)

This PR deploys the dev environment to Cloudflare Pages + Worker Orchestrator with required bindings and guardrails.

## URL

- Pages/Functions: <ATLAS_DEV_URL>

## Bindings (dev)

- KV: ATLAS_FLAGS
- D1: ATLAS_D1 (atlasit_dev)
- R2: ATLAS_R2 (atlasit-evidence-dev)
- DO: OrchestratorDO (binding ORCHESTRATOR_DO)
- Dispatch namespace: atlasit-dispatcher
- Env toggles: AWS_ENABLED="0", S3_MIRROR="0"

## Cron (dev only)

- \*/30 \* \* \* \* (sweep)
- 15 \*/2 \* \* \* (replay)

## Smoke results

- Health: GET /healthz 200 ✔︎
- Guard: GET /guardz shows bindings ✔︎
- Connectors: off by default (404/204) ✔︎
- Artifacts: artifacts/deploy_dev/{deploy.log,smoke.log,bindings.json}

## Next steps

- Add Cloudflare Access policy for /admin/\* in the dashboard.
- Keep AWS backplane disabled in dev (AWS_ENABLED=0, S3_MIRROR=0).
- Optionally enable feature flags via KV (e.g., FEATURE_CONNECTOR_DEMO=on) for testing.
