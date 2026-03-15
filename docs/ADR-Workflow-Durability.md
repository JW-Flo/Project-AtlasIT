# ADR: Workflow Durability via Durable Objects, Queues, and DLQ

**Status:** Accepted
**Date:** 2026-03-14
**Author:** Agent B (Platform Architect)
**Task:** T3 — Workflow durability (DO+Queues+DLQ)

## Context

The JML Engine (Joiner/Mover/Leaver workflow orchestrator) existed only as a
minimal compatibility shim in `index.js`. It returned a static JSON response
with no step execution, no persistence, no retries, and no dead-letter queue.
The unit tests in `tests/jml-engine.test.ts` expected Durable Object-like
persistence and DLQ behavior that the shim could not satisfy.

The authoritative brief requires:

1. Durable Object alarm-driven resumption for crash recovery
2. Queue-based step task fan-out
3. DLQ routing after `max_retries` exhausted
4. Versioned, deterministic run state schema
5. Platform abstraction interfaces that do not leak Cloudflare-specific types

## Decision

### Three-plane separation

All new code follows the three-plane architecture defined in the brief:

| Plane                   | Location                                     | Concern                                                     |
| ----------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| **Platform interfaces** | `packages/shared/src/platform/interfaces.ts` | Portable contracts (`QueueBus`, `WorkflowStateStore`, etc.) |
| **Cloudflare adapters** | `packages/shared/src/platform/cloudflare/`   | CF-specific implementations (Queue producer, DO storage)    |
| **Business logic**      | `packages/shared/src/workflow/`              | JMLEngine, step registry, step executor, types              |

Business logic NEVER imports from `@cloudflare/workers-types` or references CF
primitives directly. It depends only on the portable interfaces and receives
concrete adapters via constructor injection.

### State schema

Run state (`RunState`) carries a `schemaVersion` field (currently `1`).
Deserialization code can check this field and apply migrations when the schema
evolves. State is serialized via `canonicalJson` (sorted keys, no whitespace)
for deterministic hashing with SHA-256.

### Step execution model

Steps are defined in a static registry (`step-registry.ts`) per workflow type.
The engine iterates steps sequentially. Each step is retried up to
`DEFAULT_MAX_RETRIES` (3) times. On exhaustion, the step is marked `dlq` and a
`DLQEntry` is persisted under the `dlq:` key prefix.

In the current implementation, steps execute synchronously within a single
`handleEnqueue` call. In production, the DO alarm mechanism will schedule
wake-ups between retry attempts with exponential backoff, and step tasks will
be published to a Cloudflare Queue for fan-out to connector workers.

### Alarm-driven resumption

The `alarm()` method scans for runs in `running` or `queued` state and resumes
execution. This provides crash recovery: if a DO is evicted mid-run, the alarm
fires and the run continues from the last persisted step state.

### Backward compatibility

The `index.js` shim is replaced with a re-export:

```js
export { JMLEngine } from "./packages/shared/src/workflow/jml-engine.js";
```

This preserves the import path for existing consumers (e.g., the
compliance-worker executor).

## Consequences

- All three existing JML engine tests pass against the new implementation
- 28 additional tests cover durability, DLQ, alarm resumption, platform adapters, step registry, and canonical hashing
- `tsc --noEmit` passes with zero errors
- The compliance-worker executor continues to work via the re-export
- Future work (T5: Evidence immutability) can hook into step completion events without modifying the engine core
- Queue and DO bindings in `wrangler.toml` remain commented out until the account is upgraded to a paid plan

## Alternatives Considered

1. **Keep the shim and add persistence separately** — Rejected because the shim's response format was incompatible with the test expectations, and splitting state management from execution creates unnecessary coupling.

2. **Use D1 instead of DO storage for run state** — Rejected for this layer. DO storage provides transactional consistency within a single run, which is the right primitive for saga state. D1 is appropriate for cross-run indexes and audit queries (future work).

3. **Use Workflows API instead of custom DO** — The Cloudflare Workflows API is newer and less flexible for our retry/DLQ semantics. A custom DO gives full control over state schema, alarm scheduling, and DLQ routing.
