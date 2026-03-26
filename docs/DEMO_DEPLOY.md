# AtlasIT Demo Deployment Guide

This guide provisions the experimental console + compliance worker pairing for a shareable demo.

## Components

| Component         | Purpose                                               | Deploy Target            |
| ----------------- | ----------------------------------------------------- | ------------------------ |
| compliance-worker | Serves `/api/compliance/snapshot` (placeholder today) | Cloudflare Workers       |
| console-app       | SvelteKit UI consuming runtime `/api/config`          | Cloudflare Pages/Workers |

## Prerequisites

- Node 18+
- `wrangler` CLI authenticated (`wrangler login`)
- Cloudflare account with Workers & Pages access
- (Optional) `jq` for JSON viewing

## Environment Variables

| Variable           | Scope               | Description                           | Example                                                    |
| ------------------ | ------------------- | ------------------------------------- | ---------------------------------------------------------- |
| COMPLIANCE_BASE    | console-app runtime | Base path/origin for compliance API   | `https://your-worker-subdomain.workers.dev/api/compliance` |
| CONSOLE_PUBLIC_URL | deploy script       | Public base URL used for smoke checks | `https://atlasit-demo.pages.dev`                           |

Create `console-app/.env` (copy from `.env.example`) and set `COMPLIANCE_BASE` to the deployed compliance worker base (without trailing `/snapshot`).

```env
COMPLIANCE_BASE=https://your-compliance-worker.example.com/api/compliance
```

## Deployment Steps

1. Verify contract & build artifacts:

   ```bash
   node scripts/openapi-verify.mjs
   ```

2. Deploy compliance worker:

   ```bash
   cd compliance-worker
   wrangler deploy
   ```

3. Capture the public worker URL; form the base: `https://<subdomain>.workers.dev/api/compliance`.
4. Configure console runtime:

   ```bash
   cd ../console-app
   cp .env.example .env
   # edit COMPLIANCE_BASE=... to point at the worker base
   ```

5. Build & deploy console (example Cloudflare Pages via Wrangler):

   ```bash
   npm run build
   # example (adjust project name):
   wrangler pages deploy build --project-name=atlasit-console-demo
   ```

6. (Optional) Use orchestrator script with env overrides:

   ```bash
   CONSOLE_PUBLIC_URL=https://atlasit-console-demo.pages.dev \
   COMPLIANCE_WORKER_DIR=./compliance-worker \
   CONSOLE_DIR=./console-app \
   COMPLIANCE_DEPLOY_CMD="npx wrangler deploy" \
   node scripts/deploy-platform.mjs
   ```

## Validation

```bash
curl -s $CONSOLE_PUBLIC_URL/api/config | jq
BASE=$(curl -s $CONSOLE_PUBLIC_URL/api/config | jq -r .complianceBase)
curl -s "$CONSOLE_PUBLIC_URL$BASE/snapshot" | jq '.frameworkSummary[0]'
curl -s "$CONSOLE_PUBLIC_URL/console" | grep -i "AtlasIT Console" || echo "console text missing"
```

## Troubleshooting

| Symptom                     | Cause                                    | Fix                                                                |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| /api/config 404             | Build missing new route                  | Rebuild console `npm run build` & redeploy                         |
| Snapshot fetch fails (CORS) | Cross-origin worker missing CORS headers | Add `Access-Control-Allow-Origin: *` to compliance worker (future) |
| Raw JSON link missing       | Runtime config failed to load            | Check network tab for `/api/config` error                          |

## Next Enhancements

- Real persisted snapshot (D1)
- Policy evaluation endpoint
- OpenAPI contract gate (CI) enforcement
- Auth token gating for non-demo environments

---

Append-only. Do not remove earlier fields or steps; update with new phases as capabilities evolve.
