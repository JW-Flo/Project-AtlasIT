# AtlasIT MVP Deploy (Demo-Ready)

See `ops/hand-off.md` for the authoritative deploy runbook and smoke tests.

This guide deploys a minimal, working demo stack:

- Dispatch Worker (Workers for Platforms gateway)
- Compliance Worker (demo compliance API with D1 + R2 bindings)
- AI Orchestrator (health, rate/quota; optional)
- Console App (SvelteKit UI on Workers)

## Prereqs

- Node 18+
- Wrangler logged in (wrangler login)
- Cloudflare account and required resources (D1, KV, R2) in wrangler.toml

## One-shot deploy

```bash
# from repo root
npm install --workspaces --include-workspace-root
npm run deploy:mvp
```

Optional smoke after deploy:

```bash
export CONSOLE_PUBLIC_URL="https://atlasit-console.YOUR.workers.dev"
node scripts/deploy-mvp.mjs
```

## Manual endpoints

- Console: /console/platform-status
- Console health API: /api/health
- Runtime config: /api/config
- Compliance worker: /api/compliance/health, /api/compliance/snapshot
- Dispatch: /__health, /admin/usage/summary (requires x-admin-token)
- Orchestrator: /health

## Notes

- Health/config responses are append-only by convention.
- D1 writes are parameterized.
- Demo disables console auth via wrangler vars; re-enable for prod.

---
Append-only doc; keep concise.
