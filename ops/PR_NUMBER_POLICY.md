# PR Number & Mapping Policy

## Goals
Provide deterministic, conflict-free pull request number references in internal tracking files (e.g. `ops/codex-active-work.json`).

## Principles
1. Source of truth for actual PR numbers is the Git hosting platform (GitHub).
2. Internal placeholders must never collide once a real PR number is known.
3. Committed (merged) features retain their originally assigned canonical number.
4. Duplicates discovered post‑hoc are re-assigned the next available provisional number.
5. A provisional number becomes canonical only after the PR is opened with that number.
6. Historical references are immutable; if renumbering occurs, add an alias entry (optional) rather than rewriting history in past artifacts.

## Lifecycle States
- `planned`: ideation; no branch yet.
- `staged`: branch exists; placeholder assigned (e.g. `PR15 TBD`).
- `open`: PR opened; replace `TBD` with actual URL or add `prUrl` field.
- `committed`: merged; status updated, placeholder frozen.
- `archived`: no longer active; retained for audit.

## Renumbering Procedure
When a duplicate provisional ID is detected:
1. Identify item(s) without an open PR first.
2. Assign next free integer (scan existing canonical + provisional IDs).
3. Update `pr` field (e.g. from `PR13 TBD` → `PR15 TBD`).
4. Add note in `notes` or `renumberedFrom` field if needed.
5. Update `updatedAt` timestamp.

## Example
```
Before:
  feat/ci-workflows  PR13 TBD
  infra/aws-backplane-skeleton PR13 #37
After:
  feat/ci-workflows  PR15 TBD (renumbered from PR13 TBD)
  infra/aws-backplane-skeleton PR13 #37 (canonical)
```

## Required Fields
| Field | Purpose |
|-------|---------|
| `branch` | Git branch name |
| `pr` | Display label (`PR12 TBD`, `PR4`, etc.) |
| `prUrl` | Populated when PR is open (canonical) |
| `status` | Lifecycle state |
| `notes` | Human context |
| `renumberedFrom` | Optional provenance for changed provisional IDs |

## Automation Hooks (Future)
- Pre-commit script validates uniqueness of all `PR\d+` tokens.
- CI job rejects duplicates unless accompanied by `renumberedFrom`.
- Script to auto-assign next provisional ID: `npm run ops:next-pr`.

## Edge Cases
- If a provisional number accidentally matches a later real PR: treat the earlier placeholder as subject to renumbering.
- Cross-repo coordination: prefix with repo key if sharing a sequence (e.g., `ATLAS-PR22`).

## Versioning
Increment this document when procedural changes occur. Current version: 1.0.0.
