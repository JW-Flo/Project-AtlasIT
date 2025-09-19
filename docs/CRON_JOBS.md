# Cron Jobs

| Job    | Schedule                   | Toggle                | Description                                                                                       |
| ------ | -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| sweep  | Managed by Cloudflare Cron | `CRON_SWEEP_ENABLED`  | Requeues stuck workflow steps older than the configured age, applying capped exponential backoff. |
| replay | Managed by Cloudflare Cron | `CRON_REPLAY_ENABLED` | Replays dead-lettered steps back into the orchestrator queue.                                     |
| rollup | Managed by Cloudflare Cron | `CRON_ROLLUP_ENABLED` | Rolls up outbox events and marks them as delivered for downstream sinks.                          |

## Admin Endpoints

Durable Object endpoints are guarded by `x-admin-token` and should only be exposed behind internal tooling.

- `POST /admin/sweep` – body `{ maxAgeMins?: number, batch?: number }`
- `POST /admin/replay` – body `{ limit?: number }`
- `POST /admin/rollup` – body `{ batch?: number }`
- `GET /admin/metrics` – returns aggregated counter totals

## Safety Notes

- Set an admin token via `ADMIN_TOKEN` in the Worker environment to restrict access.
- Cron jobs respect feature-flag toggles, enabling staged rollouts without code changes.
- Backoff windows are capped to avoid runaway delays and idempotent hashes prevent double processing.
- For production, evolve the D1 tables in `schema/d1.sql` and forward events to Queues for higher throughput.

## Environment Toggles

Set the following env vars in the Worker (via wrangler secret/vars or CI) to control cron execution:

- `CRON_SWEEP_ENABLED` – "1" or "true" to enable sweepStuck; omitted/empty defaults to enabled in non-dev. Keep unset or "0" in dev.
- `CRON_REPLAY_ENABLED` – "1" or "true" to enable replayDLQ; keep unset or "0" in dev.
- `CRON_ROLLUP_ENABLED` – "1" or "true" to enable rollupOutbox; keep unset or "0" in dev.

Note: Cron triggers are commented out in `wrangler.toml` for dev. Enable these only in staging/prod environments.
