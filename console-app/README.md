# AtlasIT Console (Cloudflare Worker / SvelteKit)

Production-oriented SvelteKit console deployed to Cloudflare Workers via `@sveltejs/adapter-cloudflare`.

## Stack

- SvelteKit (Svelte 5)
- Cloudflare Workers (edge)
- Resource bindings: D1, KV, R2, Queues, Analytics Engine

## Health Endpoint

`GET /api/health` returns:

```json
{
  "status": "ok",
  "name": "AtlasIT Console",
  "journeyId": "continental-usa-2025",
  "version": "<pkg version>",
  "commit": "<git short>",
  "resources": {
    "d1|kv|r2|analytics|queues": { "BINDING": { "ok": true, "type": "d1" } }
  }
}
```

## Deployment Workflow

1. Authenticate once:

```bash
wrangler login
```

2. Create resources (examples – substitute your account identifiers):

```bash
# D1
yarn wrangler d1 create atlas_core_db
wrangler d1 create atlas_audit_db
wrangler d1 create atlas_compliance
wrangler d1 create atlas_audit_shadow

# KV Namespaces
wrangler kv namespace create KV_SESSIONS
wrangler kv namespace create KV_CACHE
wrangler kv namespace create KV_FEATURE_FLAGS

# R2
wrangler r2 bucket create atlas-policies
wrangler r2 bucket create atlas-evidence
wrangler r2 bucket create atlas-artifacts

# Queues
wrangler queues create atlas-workflow-queue
wrangler queues create policy-rebuild
wrangler queues create risk-recalc

# Analytics Datasets
wrangler analytics create atlas_events
wrangler analytics create atlas_metrics
```

3. Update `wrangler.toml` with the real IDs produced (database_id, kv ids, etc.).

4. Dry-run deploy:

```bash
./scripts/deploy-console.sh --dry-run
```

5. Live deploy:

```bash
./scripts/deploy-console.sh
```

6. Verify health output contains `status: ok` and resource groups.

## Environment Vars

`[vars]` in `wrangler.toml` supplies static values (e.g. `APP_NAME`). Build injects `__APP_VERSION__` and `__GIT_COMMIT__`.

## Local Preview

```bash
npm install
npm run build
npm run preview
curl http://localhost:4173/api/health
```

## QA Script

Run endpoint QA against a running preview/dev server:

```bash
CONSOLE_URL=http://localhost:4173 node scripts/qa-console.mjs
```

## Notes

- Ensure build (`npm run build`) executed before `wrangler deploy` so `src/worker-entry.ts` can import generated worker bundle.
- Placeholder IDs in `wrangler.toml` must be replaced for production.
