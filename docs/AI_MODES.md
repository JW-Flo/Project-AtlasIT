# AI Operating Modes Reference (Copilot + Codex)

Purpose: Single shared bridge so both Copilot and Codex agents apply consistent workflow, guardrails, and planning heuristics without duplicating full architecture docs.

## Source of Truth Pointers

- Deep architecture & guardrails: `.github/copilot-instructions.md` (Sections 1–20 core, 21–40 operating guidance).
- Runtime essentials & lightweight prompt context: `docs/codex/minimal-runtime-context.md`.
- Incremental deltas / prompt snippets: `docs/codex/prompt-update-sheet.md` (append-only numbered sections).

## Modes

| Mode            | Primary Goal                                           | Typical Outputs                                           | Abort / Defer Conditions                                  |
| --------------- | ------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------- |
| Planner         | Decompose objective into epics/stories & TODO list     | YAML plan (see Section 36 template), ordered TODO items   | Feature outside current surface; missing bindings context |
| Orchestrator    | Execute planned changes safely & atomically            | Code diffs, tests, telemetry append, PR checklist         | Contract risk detected, failing append-only test          |
| Product Steward | Scope validation & minimal viable slice recommendation | Response with status, risk summary, next steps issue stub | Roadmap mismatch, secret/schema proliferation             |

## Mode Transition Rules

1. Start in Planner unless a fully-scoped diff already exists.
2. Switch to Orchestrator only after a valid plan (includes risk & success metrics).
3. Switch to Product Steward if request scope drifts into non-implemented domains (compliance engine, marketplace, etc.).
4. Record transitions in commit footer: `Mode-Transition: planner->orchestrator`.

## Planner Checklist (Condensed)

- Clarify scope: runtime vs worker endpoint vs agent.
- Inventory files & bindings changes (`wrangler.toml` if new resources).
- Risks: JSON contract, secrets, performance (<100ms scan p95), protected paths.
- Draft tests: happy path + one edge (timeout, missing key).
- Produce YAML plan & TODO list (IDs, titles, status not-started).

## Orchestrator Checklist (Condensed)

1. Validate env: `npm run validate:env`.
2. Smallest diff first; avoid unrelated refactors.
3. Add/adjust unit tests (Vitest) referencing existing defensive patterns (conditional status assertions).
4. Ensure append-only health changes (diff old vs new keys).
5. Run `npm run predeploy` (typecheck + tests).
6. Self-audit (grep secrets, performance notes).
7. Document metrics or reasons if p95 > target.

## Product Steward Response Pattern

```
Status: Not implemented.
Minimal viable slice: <data provider stub / placeholder>.
Risks: contract, scope creep.
Recommendation: pursue slice only after roadmap phase ticket.
Next step: open issue with capability tag + acceptance criteria.
```

## Guardrails Snapshot

- Append-only JSON (never rename / remove existing health keys).
- Secrets via `wrangler secret put`; never in source.
- Gating precedence: `ENABLED_SCAN_TYPES` > `DISABLED_SCAN_TYPES`.
- Protected paths: enforced by `codex-work.json` + `docker/codex-exec.sh`.

## Shared Telemetry Concepts

- Proposed scan telemetry entry shape lives in minimal-runtime-context (Section 9).
- Aggregates: count, p50, p95, avg, timeoutCount — append under diagnostics; do not replace existing structures.

## Interplay: Copilot vs Codex

| Responsibility            | Copilot                             | Codex                               |
| ------------------------- | ----------------------------------- | ----------------------------------- |
| Planning YAML             | Generates                           | Consumes (sections referenced)      |
| Large diffs               | Applies patches                     | Validates protected path compliance |
| Runtime metrics expansion | Adds append-only JSON keys          | Monitors ring buffer size limits    |
| Prompt size control       | Uses trimmed context file reference | Supplies numbered sheet sections    |

## Append-Only Verification Pattern

1. Capture baseline health JSON (test fixture or first invocation).
2. Apply change.
3. Diff: ensure only new keys added; no key deletions or renames.
4. If violation → rollback & document.

## Capability Tags (Future-Proofing)

- Canonical format: lowercase dash-case (`headers-security`).
- Introduce only with documented meaning; add to prompt-update sheet.

## Self-Audit Routine (Optional Script)

- Re-run tests.
- `grep -R "API_KEY=" -n src/` and similar secret patterns.
- Health diff tool (TBD) to assert append-only.
- Performance note (qualitative if metrics absent).

## Quick Reference Commands

```bash
npm install
npm run validate:env
npm run typecheck
npm run test:unit
npm run predeploy
wrangler dev   # inside worker folder
```

## DO NOT

- Introduce compliance endpoints prematurely.
- Hardcode binding IDs or secrets.
- Replace health sections; always append.
- Expand prompts with full README (use minimal-runtime-context).

## When Unsure

Search for precedent (`src/runtime/scans/modules`, tests) before abstraction. If no match, implement minimal slice + test; escalate only for contract or secret risks.

---

Maintainers: update both `.github/copilot-instructions.md` and this file together when altering mode processes.
