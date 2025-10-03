# Logging Framework

This repository now includes a production‑ready lightweight logging utility used by the core worker and the AI orchestrator. It replaces ad‑hoc / sample log lines with structured, validated entries.

## Goals

- Consistent structured JSON across services
- Correlation ID propagation (header: `x-correlation-id`)
- Fast in‑memory access to recent logs (ring buffer) for admin diagnostics
- Optional persistence to D1 (table `logs`) and Cloudflare Analytics Engine (if bindings provided)
- Schema validation for forward compatibility & QA

## Module

`shared/log.js`

Exports:

| Export                             | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `log(level, event, payload, opts)` | Emit a structured log entry. `payload` is stored under `meta`. |
| `generateCorrelationId()`          | Generates a RFC4122 UUID (or fallback).                        |
| `getRecentLogs(limit, level?)`     | Returns last N logs from in‑memory ring buffer.                |
| `correlationMiddleware()`          | (Hono) Adds / propagates correlation id per request.           |
| `logRequestMiddleware()`           | (Hono) Emits `http.request` events with latency.               |

Log schema normalization performed via `shared/log-schema.ts`. Only approved base fields are emitted; `payload` passed to `log()` becomes `meta`.

Example emitted line:

```json
{
  "ts": "2025-10-02T18:18:05.720Z",
  "level": "info",
  "event": "apps.list",
  "correlationId": "c7c…",
  "actor": null,
  "meta": { "count": 17 }
}
```

## Admin Diagnostics Endpoint

`GET /api/v1/admin/logs/recent?limit=50&level=info`

Returns recent log entries from memory (no D1 dependency). Secured by bearer token header matching `env.ADMIN_BEARER` (or `ADMIN_TOKEN`).

## Applications API (New)

Added stub endpoints leveraging integration registry & health probes:

- `GET  /api/v1/apps` – List supported applications with connection + health
- `POST /api/v1/apps/connect` – Connect (ephemeral) `{ id }`
- `POST /api/v1/apps/disconnect` – Disconnect `{ id }`
- `GET  /api/v1/apps/status` – Connection status snapshot
- `POST /api/v1/apps/sync` – Trigger synthetic sync (returns `202` with `syncId`)

All actions are logged (`apps.connect`, `apps.disconnect`, `apps.sync`, `apps.list`). Future: persist connection state & sync results to D1.

## Smoke & QA

`scripts/log-schema-smoke.mjs --live` now:

1. Validates sample events.
2. Emits a real `smoke.live_test` event and asserts its presence in the ring buffer.

CI can invoke this script to guard schema regressions (add it to a QA step).

## Future Enhancements

- D1 migration for durable `logs` table & retention policy.
- Redaction utilities for PII fields (e.g., email, tokens) before persistence.
- Health endpoint augmentation: counters by level (p95 latency later).
- Export/batch to external SIEM (Splunk / Datadog) via Durable Object shipper.

---

Append‑only: extend (do not mutate) existing fields / events to stay backwards compatible.

## Implemented: Redaction Layer (2025-10-02)

The logger now performs defensive redaction before a log entry is normalized / persisted:

- Keys matching (case‑insensitive) `password|secret|token|authorization|api[-_]?key|session|cookie|email` are replaced with `[REDACTED]`.
- Nested objects & arrays are traversed recursively.
- Email values are partially masked (first 3 significant characters kept, remainder replaced with `***@`).
- Long string values >512 chars are truncated to 256 chars with `...[truncated]` suffix.

This guarantees no raw credentials or full email addresses are written to D1 / Analytics.

## Implemented: Logs Table Migration

Migration file: `migrations/20251002_logs.sql`

Schema (D1 / SQLite):

```sql
CREATE TABLE IF NOT EXISTS logs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ts TEXT NOT NULL,
 level TEXT NOT NULL,
 event TEXT NOT NULL,
 correlationId TEXT,
 payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts);
CREATE INDEX IF NOT EXISTS idx_logs_event ON logs(event);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
```

The worker will attempt best‑effort inserts when a `LOG_DB` (or `LOGS_DB` / `logsDB`) binding with a `.prepare()` API is present. Failures are logged with an internal warning and do not throw.

## Testing Notes

The lightweight test harness (`tests/run-tests.mjs`) exercises:

- Applications endpoint flow (connect / sync / disconnect)
- Admin logs endpoint (authorization + redaction + limit)

Add new event validations there or enhance with Vitest as the test surface grows.
