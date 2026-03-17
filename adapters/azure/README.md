# Azure Adapter

Generated AtlasIT Cloudflare Worker adapter.

## Commands

- `npm run dev` - local worker development
- `npm run type-check` - strict TypeScript check
- `npm run deploy` - deploy via Wrangler

## Required secrets

Set via Wrangler secret store (do not commit secrets):

- `ADAPTER_SECRET`

## Environment variables

- `ADAPTER_NAME=azure`
- `ORCHESTRATOR_URL`

## Migrations

Run D1 migrations before deployment:

```bash
npx wrangler d1 migrations apply atlas-shared-db
```
