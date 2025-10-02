# Codex Prompt / Update Sheet

Use this numbered sheet for incremental instructions. Reference only section numbers you need (e.g. "Use sections 1,2,5"). Keep sections succinct (<500 chars). Append new sections; never edit existing text (immutability aids diffing & reproducibility).

Core architecture summary lives in `docs/codex/minimal-runtime-context.md`; consult that for structural context, use this sheet for change deltas.

### Section Index

1. Registry & Feature Kinds
2. Scan Gating & Timeouts (Current State)
3. Telemetry Ring Buffer (Current State)
4. Admin Reload & Diagnostics (Current State)
5. Pending Enhancements (Next Cycle)
6. Jobs & Data Providers (Summary)
7. Health Append Rules
8. Dynamic Config (Future Cache Plan)
9. Security Headers Audit Helper (Planned)
10. Capability Expansion Guardrails
11. Telemetry Enhancements (Implemented)

### 1. Registry & Feature Kinds

Registry snapshot: { version, counts, items[], sourceHash }. Kinds: scan, job, data. RegisteredItem may include run(), schedule.intervalMs, fetch(), provides[], requires[]. Append-only for new fields.

### 2. Scan Gating & Timeouts (Current State)

Enable precedence: ENABLED_SCAN_TYPES > DISABLED_SCAN_TYPES (if no allowlist). Capability tags (provides/requires) reserved for future gating. Timeout default via SCAN_MODULE_TIMEOUT_DEFAULT + per-module override. On timeout: status=timeout, synthetic finding, duration capped.

### 3. Telemetry Ring Buffer (Current State)

Per-module buffer size 50 capturing { scanId, started, durationMs, status, findings, timeout?, errorMessage? }. Aggregates: count, p50, p95, avg, lastMs, timeoutCount. Global total mirrors.

### 4. Admin Reload & Diagnostics (Current State)

Debounced reload (2s) rebuilds registry & reapplies gating. Diagnostics returns scanTimings { total, modules }. Health adds scanPerf { total.p95, modules[id].lastMs } (append-only).

### 5. Pending Enhancements (Next Cycle)

Add errorCount, successRate, timeoutRate, global successRate; SCAN_TELEMETRY_WINDOW (clamp 5-200) resize; /api/\_scan-metrics { total, modules } only; emit scan.telemetry.resized on size change.

### 6. Jobs & Data Providers (Summary)

Scheduler: delayed first run; stats runs/errors/avgMs. metrics-snapshot job (30s) captures registry + scheduler. site-metadata provider returns registry { version, counts, sourceHash }.

### 7. Health Append Rules

Never remove/rename existing keys. Only append nested objects or add new top-level keys. Validate via append-only tests.

### 8. Dynamic Config (Future Cache Plan)

Planned LRU (max 100) with hit/miss/evict counters exposed at diagnostics.dynamicConfigCache.

### 9. Security Headers Audit Helper (Planned)

classifySecurityHeaders(headers) -> { issues:[{ id,severity,description }] }. Severity: high (missing CSP), medium (missing HSTS), low (missing X-Frame-Options). Pure function.

### 10. Capability Expansion Guardrails

Define canonical capability ids; document provides/requires. Fail closed if required capability absent. Keep gating O(n) over modules (no deep graphs).

### 11. Telemetry Enhancements (Implemented)

Implemented items from prior Section 5: dynamic SCAN_TELEMETRY_WINDOW (clamped 5-200) with resize event scan.telemetry.resized; per-module metrics now include errorCount, timeoutCount, timeoutRate, successRate; global successRate computed; new /api/\_scan-metrics endpoint (root & immersive) returning { total, modules } only; health remains append-only using total.p95 & latest module durations.
