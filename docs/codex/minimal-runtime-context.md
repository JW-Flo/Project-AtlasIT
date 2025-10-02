# Minimal Runtime Context (Trimmed for Codex)

Scope: Only the essentials Codex needs for current capability gating / telemetry phase.

For incremental updates and numbered deltas, see `docs/codex/prompt-update-sheet.md` (reference specific section numbers instead of pasting this whole file).

1. Feature Registry
   - Location: `src/runtime/registry/registry.ts`
   - Public API: `register(item)`, `getSnapshot()`, `list(kind?)`, `find(kind,id)`
   - Snapshot shape: `{ version:number, counts:Record<FeatureKind,number>, items: RegisteredItem[], sourceHash:string }`
   - RegisteredItem core fields: `id`, `kind`, `version?`, `provides?`, `requires?`, `run?` (for scan/job), optional `schedule` (job), `fetch` (data).

2. Feature Types
   - Kinds in use this phase: `scan`, `job`, `data`.
   - JobFeature: adds `schedule.intervalMs`, async `run(ctx)`.
   - DataProviderFeature: async `fetch(params, ctx)`.

3. Scan Runtime (focus for gating/telemetry)
   - Each scan module self‑registers with `kind:'scan'` + `run()`.
   - Environment gating precedence (target for enhancement):
     1. `ENABLED_SCAN_TYPES` (comma allowlist)
     2. `DISABLED_SCAN_TYPES` (comma denylist) if allowlist absent
     3. Default = all registered scan modules
   - Planned additions (Codex to implement): capability tag gating via `provides`/`requires`, timeouts per scan, telemetry ring buffer (store recent N execution metrics), admin reload.

4. Jobs
   - Scheduler module: `src/runtime/jobs/scheduler.ts` (delayed first run, stats in memory: runs, errors, avgMs).
   - Metrics snapshot job (`metrics-snapshot`): every 30s captures registry + scheduler snapshot.
   - No persistence; safe to ignore for gating except reading stats later.

5. Data Providers
   - `site-metadata` provider returns registry summary (counts + sourceHash).
   - Fetch mechanism: `fetchProvider(id)` in `src/runtime/data/providers.ts`.

6. Health Integration (current)
   - Health augmentation exists externally; Codex will append telemetry fields (do NOT remove existing keys).

7. Logging Conventions
   - Use `log(level, event, payload)`; existing events: `feature.registered`, `registry.snapshot`, `scheduler.started`, `metrics.snapshot`, `job.run.error`.

8. Guardrails
   - Append-only: never rename existing health keys.
   - Keep ring buffer size modest (e.g. 50–100 entries) to avoid memory bloat.
   - Timeouts: per-module budget (e.g. 5s) with abort + status recorded in telemetry entry.

9. Telemetry Entry (proposed shape for Codex)

   ```jsonc
   {
     "scanId": "headers",
     "started": 1730480000000,
     "durationMs": 42,
     "status": "ok" | "timeout" | "error",
     "findings": 12,
     "errorMessage?": "..."
   }
   ```

10. Admin Reload (proposed)
    - Re-import scan modules + rebuild snapshot + restart scheduler.
    - Expose via `/api/admin/runtime/reload` (auth gated) responding with `{ version, counts, reloadedAt }`.

Use this file instead of full README / large test fixtures to keep prompts below context limits.
