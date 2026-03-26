# ADR: Dynamic Runtime Architecture (Phase 1)

## Context

- AtlasIT needs a runtime abstraction for pluggable features (scans, jobs, APIs, UI toggles) without coupling to existing route handlers.
- Current implementations rely on static configuration and ad-hoc environment flags, making staged rollouts and observability harder.
- Phase 1 introduces a side-by-side foundation to catalogue runtime features and load dynamic configuration without impacting production flows yet.

## Goals (Phase 1)

- Provide a feature registry capable of building immutable snapshots for downstream consumers.
- Load dynamic configuration from multiple sources (KV, environment, defaults) with deterministic precedence and caching.
- Offer lightweight utilities (hashing, logging) to support future orchestration layers.
- Keep the implementation additive so existing scans and APIs remain unchanged.

## Non-Goals

- Wiring the registry into existing scan execution or API routing.
- Authoring new feature definitions beyond scaffold examples used in tests.
- Implementing persistence, admin UI, or mutation endpoints for dynamic config.
- Delivering advanced validation or schema management for config payloads (only basic guards in Phase 1).

## Architecture Diagram

```
+--------------------+        +-------------------------+
|  Feature Registry  |<------>|  Dynamic Config Loader  |
+--------------------+        +-------------------------+
          ^                               ^
          |                               |
          |                               |
          v                               v
  Feature Providers              KV Store / Environment
```

## Registry API (Phase 1)

- `initRegistry(items?)`: reset state and optionally seed with feature definitions.
- `register(item)`: add a feature; duplicates (same `kind` + `id`) log a warning and are ignored.
- `buildSnapshot()`: produce a frozen snapshot containing counts, items, and a source hash.
- `getSnapshot()`: retrieve the latest snapshot (building one if needed).
- `find(kind, id)`: lookup a single feature in O(1) time.
- `list(kind?)`: enumerate features, optionally filtered by kind.

## Config Precedence

| Priority | Source      | Notes                                             |
| -------- | ----------- | ------------------------------------------------- |
| 1        | Runtime KV  | `ATLAS_KV.get('dynamic-config')` JSON payload     |
| 2        | Environment | `ENABLE_*` / `DISABLE_*` comma lists              |
| 3        | Defaults    | Inline empty maps (`enable = {}`, `disable = {}`) |

## Future Phases TODO

- Integrate registry snapshots with scan execution and policy orchestration.
- Surface registry/config diagnostics through observability endpoints.
- Extend config schema (typed guards, validation errors, audit logs).
- Support partial reloads and streaming updates from control plane services.
- Add developer tooling for feature dependency graph visualization.

## Phase 2–3 Progress

- Security scan modules (headers, ssl, info, threat-intel, cve) now live in `src/runtime/scans`, registered via the feature registry and executed through the dynamic config service.
- Full scan aggregation derives enabled modules from `ENABLED_SCANS` / `DISABLE_SCANS`, logging module-level durations and raising `NO_ACTIVE_SCANS` when configuration filters everything out.
- API routes register themselves in the shared registry and surface metadata through `/api/_routes`, allowing the runtime to enumerate service capabilities without bespoke wiring.

## Phase A – BaseFeature Contract

- Introduced `src/runtime/features/types.ts` describing the unified `BaseFeature` shape plus the `ScanFeature` specialisation (mandatory `run` method).
- `registerFeature` and `getFeatures(kind?)` provide a capability-aware registry snapshot layered on the existing immutable snapshot logic, including capability tags (`provides[]`) for future gating.
- Scan modules now register as first-class `ScanFeature` instances, while the health endpoint exposes appended `features.version` and `features.countsByKind` telemetry without breaking previous consumers.
- Capability gating precedence: `ENABLED_SCAN_TYPES` → `ENABLE_CAPABILITIES` → `DISABLED_SCAN_TYPES` → `DISABLE_CAPABILITIES` (all case-insensitive).
- Execution guardrails: module-level timeouts (`SCAN_MODULE_TIMEOUT_DEFAULT`, `SCAN_MODULE_TIMEOUT_<ID>`) emit synthetic findings (`MODULE_TIMEOUT`, `MODULE_FAILED`) and continue the aggregation flow; telemetry captures p50/p95/avg/timeout counts via `getScanTimings()`.
- Observability endpoints: `/api/_diagnostics` returns rolling scan timings, `/api/admin/reload` (debounced 2s) rebuilds registry snapshots and returns `{ ok, version, counts, enabledScanIds }`, while `/api/health` now includes `scanPerf` (total p95 + per-module lastMs) append-only.
