# Workspace Status (Sept 2025)

| Repo              | Purpose                                       | Implemented Today                                                               | Missing (Vision)                                            | Last Update |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------- |
| Project-AtlasIT   | Core Workers (onboarding, orchestrator, docs) | 3 workers deployed; alignment plan; framework decision in `docs/FE_DECISION.md` | Compliance engine, policy gen, directory sync, UI dashboard | 2025-11-17  |
| JW-Site           | Front-end prototype staging                   | README aligned; references `docs/FE_DECISION.md` for UI scope                   | Actual dashboard app, integration calls                     | 2025-11-17  |
| AWhittleWandering | Tesla telemetry demo (independent)            | Realtime vehicle tracking infra                                                 | Not tied to AtlasIT (optional future ingestion bridge)      | <!--DATE--> |

## Reality Gap Summary

The production footprint is intentionally minimal (automation + docs). High-fidelity governance UI and compliance/policy modules are **not built**. Roadmap phases in `Project-AtlasIT/ROADMAP.md` define the implementation path.

## Next Priority Candidates

1. Phase 1 scaffold (SvelteKit frontend + compliance score stub on `codex/phase-1-ui-scaffold`)
2. Compliance D1 schema & periodic score job
3. Policy template engine + tenant profile model

## Verification Checklist

- [x] README reality disclaimer (Project-AtlasIT)
- [x] Roadmap file created
- [x] Legacy branding isolation (ALIGNMENT_PLAN / LEGACY.md)
- [ ] Phase 1 code scaffold committed (branch exists; stub views pending)

Update this file whenever significant phase progress occurs.
