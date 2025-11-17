# Repository Naming & Evidence Conventions

To keep artifacts consistent and avoid drift across subprojects, use these conventions for new files, branches, and evidence records. These guidelines do not alter runtime code paths but help prevent scattered or duplicate documentation.

## Branches

- Use feature branches in the form `codex/{feature}` for any automation or manual changes (e.g., `codex/repo-organize`).
- Avoid working directly on shared branches like `work`; open a dedicated feature branch before committing.

## Evidence & Logs

- Store evidence JSON under `artifacts/` using the `EV-<short-purpose>.json` pattern (for example, `artifacts/EV-repo-organize.json`).
- Record execution summaries in `ops/.codex.done`, including commands executed, hashes for new evidence, and test results (if any).
- When adding new evidence, include `trace_id`, `timestamp` (UTC ISO-8601), `control_id`, and a short `summary`.

## Documentation Placement

- Consolidate decision records and framework rationale in `docs/FE_DECISION.md` and reference them from roadmap/status files instead of duplicating analysis.
- Place alignment and process notes inside `ops/` (e.g., `ops/ALIGNMENT_PLAN.md`, `ops/NAMING_CONVENTIONS.md`) rather than scattering similar content across multiple folders.

## File Hygiene

- Remove obsolete scratch files, local experiment outputs, and empty directories once no longer referenced in documentation or scripts.
- Prefer descriptive filenames without duplicate extensions (e.g., avoid `*.txt.txt`) and avoid ad hoc logs in the repository root; place logs under `artifacts/` or scoped subdirectories.
