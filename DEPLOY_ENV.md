# Project-AtlasIT Orchestrator Deployment Environment Reference

## Overview

Cloudflare Worker "ai-orchestrator" (entry: `ai-orchestrator/index.js`) provides AI task routing, rate limiting, daily quota enforcement, and workflow endpoints. This document enumerates required secrets/vars for CI and runtime.

## Required Secrets (GitHub Actions)

| Secret        | Purpose               | Minimum Cloudflare Scopes                                 |
| ------------- | --------------------- | --------------------------------------------------------- |
| CF_API_TOKEN  | Deploy Worker         | Account:Workers Scripts (Edit), Account:KV Storage (Edit) |
| CF_ACCOUNT_ID | Cloudflare account id | N/A (static)                                              |

## Runtime Environment Variables (Wrangler / Dashboard)

| Variable                | Description                                | Example                                     |
| ----------------------- | ------------------------------------------ | ------------------------------------------- |
| AI_MAX_REQUESTS_PER_DAY | Daily request ceiling before 429 throttle  | 5000                                        |
| AI_ALLOWED_MODELS       | Comma list of permitted model ids          | openai:gpt-4o-mini,anthropic:claude-3-haiku |
| AI_RATE_WINDOW_SECONDS  | Sliding window length for rate limit       | 60                                          |
| AI_RATE_MAX_REQUESTS    | Max requests per window                    | 120                                         |
| AI_RATE_BLOCK_SECONDS   | Block duration after violation             | 30                                          |
| API_ALLOWED_KEYS        | Comma list of accepted x-api-key values    | key1,key2,key3                              |
| AI_LOG_LEVEL            | Log verbosity (debug\|info\|warn\|error)   | info                                        |
| WORKFLOW_MAX_STEPS      | Safety upper bound for workflow expansions | 40                                          |

## KV Namespaces

| KV Namespace  | Binding  | Purpose                                      |
| ------------- | -------- | -------------------------------------------- |
| ai_quota      | AI_QUOTA | Persist rolling daily usage & quota snapshot |
| tasks_runtime | TASKS    | Persist queued async tasks (if enabled)      |

Ensure these bindings appear in `wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "AI_QUOTA", id = "<kv-id-ai-quota>" },
  { binding = "TASKS", id = "<kv-id-tasks>" }
]
```

## Deployment (Manual)

```bash
npx wrangler deploy ai-orchestrator/index.js --name ai-orchestrator
```

## Health Verification

```bash
curl -s https://<your-worker-subdomain>.workers.dev/health | jq
```

Key fields: `rateLimit.enabled`, `quota.remaining`, `models.allowed[]`.

## Rollback

Re-deploy an earlier git commit SHA: checkout commit then rerun deploy. Worker versions can also be reverted in Cloudflare dashboard.

## Observability

- All requests logged with correlation id (header: X-Correlation-ID). Provide one to trace: `curl -H "X-Correlation-ID: test123" ...`.
- Extend health endpoint by appending (never removing) JSON fields.

## Future Enhancements

- Add D1 persistence for durable task metadata
- Add p95 latency aggregation caching layer
- Add model-specific usage counters (AI_QUOTA JSON structure extension)
