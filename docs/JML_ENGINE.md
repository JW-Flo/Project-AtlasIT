# JML Engine (Joiner / Mover / Leaver)

Status: Draft
Owner: AtlasIT Platform
Last Updated: 2025-09-17

## Overview

The JML Engine coordinates user lifecycle runs as a Durable Object (DO) backed saga. It guarantees idempotent steps, bounded retries, and compensations, emitting audit events and evidence references.

## State Model

- Run: `id`, `tenant_id`, `type` (joiner/mover/leaver), `status`, `started_at`, `completed_at`.
- Steps: ordered small units with `attempt`, `status`, `error_code`, `evidence_hash?`.
- Outbox: events to deliver (webhooks, EventBridge) with retry policy.

## Execution

1. Enqueue: POST `/api/jml/enqueue` → DO instance for tenant processes queue.
2. Persist: insert run + steps in D1; return run id.
3. Iterate: pick next step → call IdP/Connector via runtime.
4. Heavy work path: publish to EventBridge → StepFn/Lambda → callback webhook.
5. Complete: mark step/run; write evidence; emit insights on anomalies.

## Retry & Compensation

- Exponential backoff: base 2s, max 2m, max attempts 6.
- Non-retryable: 4xx except 429; retryable: 429/5xx/timeouts.
- Compensation: previously successful steps with compensators run reverse ops (e.g., remove created license on failure).

## Idempotency

- Tokens: `idempo_key = sha256(tenant_id + run_id + step_id + payload_hash)`
- Stored in D1 `idempotency_tokens` with last outcome; reused on retry/replay.

## Replay & DLQ

- DLQ table `dead_steps` with reason and payload.
- Replay endpoint `/api/jml/replay/:dead_step_id` protected by Access; re-queues step.

## Evidence

- Each step emits evidence envelopes to R2 (hash address) and indexes in D1.
- Policy decisions stored similarly; cross-linked by run id.

## Health & Metrics

- `GET /api/jml/health` returns queue depth, in-flight, error rate (rolling window).
- Analytics Engine captures p50/p95 step latency, retry counts, DLQ rate.

## Security

- DO scoped per tenant for isolation; inputs validated via Valibot/Zod.
- Access protects admin endpoints; tokens scoped per tenant.
- No long-lived credentials; prefer OIDC.
