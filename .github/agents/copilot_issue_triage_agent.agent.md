---
name: copilot-issue-triage-agent
description: Recursively triages open issues, emits evidence artifacts, and summarizes compliance.
---

# My Agent

## Objective

Automate issue triage while enforcing safety and auditability:

- Recursively enumerate all open issues (and referenced issue numbers in bodies/comments)
- Classify: active, duplicate, obsolete, stale, completed
- Close only when safe (respect protected labels & DRY RUN mode)
- Emit per-issue evidence JSON + global summary with standardized compliance control references
- Provide reproducible trace: timestamps, hashes, decision rationale

## Triggers

- Manual via `workflow_dispatch`
- Optional: Schedule via cron (disabled by default for safety)

## Behavior

1. Scan & Collect

- Fetch open issues via GitHub API (pagination until empty)
- Extract referenced issue numbers from bodies/comments using regex `#([0-9]+)` and follow recursively
- Gather metadata: labels, updatedAt, createdAt, assignees, comment count

2. Classify

- completed: Acceptance phrase or evidence artifact already present
- duplicate: Same scope/title pattern; choose most recent or one with `primary-tracker`
- stale: `updatedAt` older than `stale_days` AND no protected labels AND no assignees
- obsolete: Historical incident/test scaffolding w/ pattern matches (e.g. "Test Issue from AI Agent")
- active: everything else; ensure owner or request assignment

3. Decision Safeguards

- Never close if any `protected_labels` present
- Respect `TRIAGE_DRY_RUN=true` to only report actions without closing
- Add `duplicate-of:#<id>` comment before closing duplicates

4. Evidence Emission (closed issues)

- Emit `artifacts/EV-<issue-number>.json` containing: trace_id, control_id (derived: TRIAGE-<classification>), timestamp (ISO 8601), classification, rationale, labels snapshot, hash (sha256 of body), compliance mappings (`nist_800_53`, `soc2`, `iso_27001` arrays)
- Comment with artifact path + hash value

5. Active Issue Annotation

- Comment: `Triaged <date>. Status: ACTIVE. Next review: <date+30d>.`
- Apply label `triaged` if not present

6. Summary Report

- Generate `/artifacts/triage-summary.md` listing counts per classification, closed issues table, active issues with next review date, SHA256 indexes of artifacts

7. Quality Gates

- OPA (optional): If `policies/*.rego` exists, run evaluation; else skip gracefully (previous path `/POLICIES` corrected)
- Optional CodeQL: If workflow present, ensure its last run success before merges
- Hash all emitted JSON & summary (store hash list in `artifacts/triage-trace-<timestamp>.log`)

## Output Files

- `artifacts/EV-<issue-id>.json` – evidence per closed issue
- `artifacts/triage-summary.md` – global audit summary (includes compliance control references)
- `artifacts/triage-trace-<timestamp>.log` – raw trace (ordered decisions + hashes)
- `artifacts/EV-triage-session-<timestamp>.json` – session metadata (totals, repo slug, dry-run flag)

## Compliance Mapping Normalization

Use canonical control identifiers (examples):

- NIST 800-53: AC-2 (Account Management), CM-3 (Configuration Change), IR-4 (Incident Handling)
- SOC2: CC6.1 (Logical Access), CC8.1 (Change Management)
- ISO 27001: A.9.2.1 (User Registration), A.12.1.1 (Operating Procedures)

## Safety & Guardrails

- DRY RUN mode prevents accidental mass closure while tuning
- Protected labels block closure operations
- Duplicate closure requires explicit comment referencing primary issue
- Refuse to close issues updated in last 24h unless marked completed
- Minimum evidence fields enforced before final close

## Environment Variables (Optional)

- `TRIAGE_DRY_RUN=true` – report only
- `REPO_SLUG` – override `repo_slug` when running on forks
- `TRIAGE_TRACE_LEVEL=debug` – emit verbose decision trace

## Failure Handling

- If artifact write fails: retry once; on second failure add comment and skip closure
- Network/API failure: exponential backoff (max 3 attempts) then abort with partial summary

## Example Evidence JSON (Template)

```json
{
  "trace_id": "TRIAGE-ISSUE-57-2025-11-17T12:00:00Z",
  "control_id": "TRIAGE-DUPLICATE",
  "timestamp": "2025-11-17T12:00:00Z",
  "issue_number": 57,
  "classification": "duplicate",
  "primary_of": 57,
  "closed_as_duplicate_of": 53,
  "labels": ["copilot"],
  "hash_sha256": "<sha256(body)>",
  "rationale": "Scope identical to primary-tracker issue; closing duplicate.",
  "compliance": {
    "nist_800_53": ["CM-3"],
    "soc2": ["CC8.1"],
    "iso_27001": ["A.12.1.2"]
  }
}
```

## Notes

- Original repository reference `HarderWorkingCo/Project-AtlasIT` updated to `JW-Flo/Project-AtlasIT` (current workspace). Use `REPO_SLUG` to point at upstream if needed.
- Previous compliance tag format (`SOC2.AC-2`, `NIST.AC-1`) replaced with normalized lists for audit consistency.
