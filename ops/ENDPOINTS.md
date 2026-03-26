# Endpoint Catalog

Current AtlasIT service endpoints (feat/pr12-idp-core-okta). Authentication reflects default worker bindings; rate limits apply per `x-api-key` when `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_SECONDS` are configured.

## Onboarding Worker

| Method | Path                                     | Auth                                    | Description                                                              | Notes                                                                       |
| ------ | ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| GET    | `/health`                                | None                                    | JSON health probe with service metadata.                                 | Public; excluded from API key + rate limit checks.                          |
| POST   | `/onboarding/start`                      | `x-api-key` (if `API_ALLOWED_KEYS` set) | Generates onboarding question set for supplied industry/requirements.    | Idempotent content generation; rate limited per API key when enabled.       |
| POST   | `/onboarding/submit` (`/api/onboarding`) | `x-api-key` (if configured)             | Submits onboarding payload to core handler and emits evidence artifacts. | Adds `x-request-id`/`x-actor` headers; rate limited.                        |
| GET    | `/api/onboarding/questions`              | `x-api-key` (if configured)             | Returns catalogued questions filtered by query parameters.               | Supports `industry`, `req` (multi) or `requirements` CSV; rate limited.     |
| GET    | `/api/onboarding/:tenantId`              | `x-api-key` (if configured)             | Retrieves stored onboarding status/state for a tenant.                   | 404 when session absent; rate limited; response echoes request + actor IDs. |

## AI Orchestrator

| Method | Path            | Auth        | Description                                                                    | Notes                                                            |
| ------ | --------------- | ----------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| GET    | `/healthz`      | None        | Text health probe for uptime checks.                                           | Public; skips approval and rate-limit guards.                    |
| GET    | `/health`       | None        | JSON health snapshot with timestamp and request id.                            | Public; includes actor echo when provided.                       |
| GET    | `/status`       | `x-api-key` | Summarizes orchestrator state (pending tasks, deployments, terminal commands). | Approval hook runs before response; rate limited.                |
| POST   | `/task`         | `x-api-key` | Registers task for orchestration and triggers AI assistance when needed.       | Approval hook + rate limit; tasks stored in-memory today.        |
| POST   | `/terminal`     | `x-api-key` | Proxies terminal command execution through orchestrator stub.                  | Returns simulated output; tracked per command id; rate limited.  |
| POST   | `/workflow`     | `x-api-key` | Creates in-memory workflow definition with optional custom steps.              | Responds `201` with workflow metadata; rate limited.             |
| GET    | `/workflow/:id` | `x-api-key` | Fetches workflow state by identifier.                                          | 404 when missing; outputs request + actor context; rate limited. |

## Documentation Worker

| Method | Path          | Auth | Description                                                | Notes                                                              |
| ------ | ------------- | ---- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/health`     | None | JSON health response with service metadata and request id. | Public; emits `x-request-id` header for traceability.              |
| GET    | `/docs`       | None | Minimal docs index placeholder returning `{ ok: true }`.   | Experimental; returns informational stub until ingestion is wired. |
| GET    | `/docs/index` | None | Alias for `/docs` JSON placeholder.                        | Experimental alias for early consumers.                            |

Update this catalog as new routes are promoted or authentication models change.
