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

## Mover Flow

The Mover flow handles user role transitions (department, title, manager changes) within the organization.

### Overview

When an employee changes roles—such as moving from Customer Success to Revenue Operations—the Mover flow ensures:

- User attributes are updated across all identity providers and connectors
- Entitlements are reconciled (adding new access, removing obsolete access)
- MFA compliance is maintained
- Audit evidence is generated for compliance

### Steps

1. **validate-profile**: Confirm user exists and fetch current attributes from IdP
2. **apply-role-change**: Update IdP with new department, title, and manager attributes
3. **reconcile-entitlements**:
   - Remove entitlements no longer needed (based on previous department/role)
   - Add entitlements required for new role
   - Retain entitlements common to both roles
   - Verify MFA compliance continues
4. **notify-stakeholders**: Send email/Slack notifications to new manager, previous manager, and IT ops

### Entitlement Reconciliation

The system calculates delta between previous and target entitlements:

```javascript
{
  "add": ["clari", "mode"],           // New tools for Revenue Ops
  "remove": ["gong"],                  // No longer needed
  "retain": ["okta", "salesforce"]     // Common to both roles
}
```

Security-first approach: Removals are processed before additions to minimize over-privileged windows.

### Evidence Schema

Each mover run emits evidence to `/artifacts/jml/mover/EV-mover-<trace_id>.json`:

```json
{
  "trace_id": "mover-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-05T12:00:00Z",
  "user_id": "user-move-002",
  "delta_summary": {
    "department": {
      "from": "Customer Success",
      "to": "Revenue Operations"
    },
    "title": {
      "from": "Account Manager",
      "to": "Revenue Ops Manager"
    }
  },
  "entitlement_changes": {
    "add": ["clari", "mode"],
    "remove": ["gong"],
    "retain": ["okta", "salesforce"]
  },
  "control_ids": ["AC-2", "AC-6", "IA-2"],
  "status": "completed"
}
```

### Control Mappings

- **AC-2** (Account Management): Role changes tracked and approved
- **AC-6** (Least Privilege): Obsolete access removed on role change
- **IA-2** (Identification and Authentication): MFA compliance verified post-change

### Error Handling

Failed mover runs follow standard retry/DLQ procedures. Partial failures (some connectors succeed, others fail) are marked with `status: "partial"` and include detailed error information for remediation.

## Security

- DO scoped per tenant for isolation; inputs validated via Valibot/Zod.
- Access protects admin endpoints; tokens scoped per tenant.
- No long-lived credentials; prefer OIDC.
