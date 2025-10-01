# Data Retention Matrix

Status: Draft
Owner: Platform Engineering
Last Updated: 2025-10-01

## Purpose

Define retention durations, purge strategies, and rationale for all key data artifacts handled by AtlasIT compliance & policy subsystems. Ensures predictable storage growth, regulatory alignment, and auditable lifecycle management.

## Summary Table

| Artifact                          | Location                                      | Key Identifier      | Retention Policy       | Purge Mechanism                     | Rationale                            | Notes                                                        |
| --------------------------------- | --------------------------------------------- | ------------------- | ---------------------- | ----------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| EvidenceEnvelope                  | R2 bucket `evidence`                          | SHA256 hash         | Indefinite (immutable) | Not purged (manual only)            | Long‑term audit & forensic integrity | `If-None-Match: *` enforced; canonical JSON stored verbatim. |
| Evidence Index Row                | D1 `evidence_index`                           | hash (UNIQUE)       | Indefinite             | Not purged                          | Fast lookup & integrity anchor       | Includes payload snapshot + metadata for replay              |
| ComplianceSnapshot (JSON)         | R2 `compliance_snapshot/<tenant>/<date>.json` | tenant + date       | 400 days rolling       | Daily purge script                  | Historical year + comparison window  | Extended retention via export pipeline                       |
| Snapshot Index Row                | D1 `snapshots`                                | tenant_id (UNIQUE)  | 400 days rolling       | SQL DELETE + VACUUM weekly          | Align with R2 object retention       | Stores canonical payload + generated_at timestamp            |
| PolicyPack Metadata               | D1 `policy_packs`                             | pack name + version | Indefinite             | Never delete (append-only)          | Traceable policy lineage             | Deprecated versions flagged not removed                      |
| Raw Policy Pack Source            | R2 `policy_packs/<name>/<version>/`           | path                | Indefinite             | Not purged                          | Reconstruct evaluation context       | Immutable once published                                     |
| Access / Request Logs             | Workers Analytics / Export                    | request id          | 30 days live           | Auto-expire / external cold storage | Cost vs. diagnostic value            | Optionally archive to cold store                             |
| Structured Metrics (aggregated)   | Analytics Engine                              | metric labels       | 90 days                | System TTL                          | Trend & SLO validation               | Longer term via external export                              |
| Error Events                      | Log stream / D1 (future)                      | event id            | 60 days                | TTL or purge job                    | Postmortem & regression tracking     | PII scrubbing enforced                                       |
| Policy Evaluation Traces (future) | R2 `traces/`                                  | eval id             | 30 days                | Rolling purge job                   | Debugging + tuning                   | Optional feature flag                                        |
| Temporary Cache Entries           | KV                                            | cache key           | <= 24h                 | TTL                                 | Performance optimization             | No PII stored                                                |

## Purge Execution

| Mechanism               | Schedule        | Tooling                        | Observability                 |
| ----------------------- | --------------- | ------------------------------ | ----------------------------- |
| R2 Snapshot Deletion    | Daily 02:00 UTC | Cloudflare cron trigger worker | Logs count + bytes freed      |
| D1 Snapshot Row Cleanup | Daily 02:05 UTC | Same cron worker (SQL)         | Rows deleted metric           |
| Metrics Expiry          | Automatic       | Platform-managed               | N/A (system)                  |
| Log Rotation            | Automatic (30d) | Workers platform               | External export success ratio |
| Trace Purge             | Daily 02:10 UTC | Cron worker (conditional)      | Traces removed metric         |

## Governance

Changes to retention values require:

1. Risk assessment (data classification impact).
2. Update to this matrix (append change log section).
3. Notification to compliance officer (future role) if shortening retention.

## Change Log

| Date       | Change                                      | Author             |
| ---------- | ------------------------------------------- | ------------------ |
| 2025-10-01 | Documented evidence immutability + metadata | platform-assistant |
| 2025-09-30 | Initial matrix created                      | platform-assistant |

---

Retain this file append-only; obsolete entries should be marked "deprecated" rather than removed to preserve historical intent.
