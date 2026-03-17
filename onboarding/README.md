# AtlasIT Onboarding Service

Cloudflare Worker for tenant provisioning. Handles initial tenant setup, configuration generation, and onboarding session management.

## Architecture

```
onboarding/
├── src/
│   ├── handlers/          # Request handlers
│   │   └── onboarding.ts  # Main onboarding flow
│   ├── services/          # Business logic
│   │   ├── ai-config.ts   # Configuration generation
│   │   └── template.ts    # Template generation
│   ├── utils/             # Helper functions
│   │   ├── error.ts       # Error handling
│   │   └── validation.ts  # Configuration validation
│   ├── types.ts           # TypeScript interfaces
│   └── index.ts           # Main entry point (Hono)
├── migrations/            # D1 migrations
└── wrangler.toml          # Cloudflare Workers config
```

## Technical Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** D1 (tenants, onboarding_sessions)
- **Storage:** KV (sessions, cache)
- **Validation:** Zod
- **Testing:** Vitest

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | None | Health check |
| `/onboarding/start` | POST | x-api-key | Start onboarding flow |
| `/onboarding/submit` | POST | x-api-key | Submit onboarding payload |
| `/api/onboarding/questions` | GET | x-api-key | List onboarding questions |
| `/api/onboarding/:tenantId` | GET | x-api-key | Get tenant onboarding status |

## Development

```bash
cd onboarding
pnpm install
pnpm dev          # wrangler dev
pnpm test         # Run tests
```

## Deployment

```bash
wrangler deploy              # Deploy to production
wrangler deploy --env dev    # Deploy to dev
```

## Database Schema

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  config TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE onboarding_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  data TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```
