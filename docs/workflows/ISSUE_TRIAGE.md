# Automated Issue Triage Workflow

## Overview

This workflow automatically triages open issues in the repository by recursively scanning all issues (including sub-issues and linked dependencies), evaluating their status, and closing issues that are resolved, redundant, or stale.

## Features

- **Recursive Scanning**: Scans all open issues and follows links to sub-issues and dependencies
- **Smart Decision Tree**: Evaluates issues based on:
  - Resolution status (closed PR references, resolved labels)
  - Redundancy (duplicate issues)
  - Staleness (>60 days inactive with no ownership)
- **Evidence Generation**: Creates compliance-ready artifacts for every action
- **Compliance Mapping**: Maps actions to SOC2, NIST 800-53, and ISO27001 controls
- **Active Issue Tracking**: Comments on active issues with triage status and next review date

## Usage

### Manual Trigger

Run the workflow manually from the Actions tab:

1. Go to Actions → Automated Issue Triage
2. Click "Run workflow"
3. Choose dry run mode:
   - `true`: Preview changes without closing issues
   - `false`: Execute changes and close issues

### Scheduled (Optional)

The workflow can be scheduled via cron (currently disabled for safety). To enable:

1. Uncomment the `schedule` section in `.github/workflows/issue-triage.yml`
2. Adjust the cron expression as needed

## Outputs

### Evidence Artifacts

For each closed issue, generates:
- `artifacts/EV-issue-<number>.json`: Evidence artifact with:
  - `trace_id`: Unique identifier for the action
  - `control_id`: Issue identifier (ISSUE-<number>)
  - `timestamp`: ISO 8601 timestamp
  - `issue_metadata`: Full issue details
  - `action`: Action taken (CLOSED)
  - `reason`: Reason for closing
  - `compliance_tags`: SOC2.AC-2, NIST.AC-1, ISO.9.2.1
  - `hash`: SHA-256 hash of the evidence

### Summary Report

- `artifacts/triage-summary.md`: Markdown summary with:
  - Statistics (total processed, closed, active)
  - Table of closed issues with reasons
  - Table of active issues with assignees
  - Compliance mappings
  - Links to evidence artifacts

### Execution Log

- `artifacts/triage-trace-<timestamp>.log`: Complete execution log

## Decision Logic

### Issue is Closed If:

1. **Resolved**: Has resolved/fixed/completed label OR references a closed PR
2. **Redundant**: Marked as duplicate OR similar to a closed issue
3. **Stale**: No activity for >60 days AND no assignees AND no "in progress" label

### Issue Remains Active If:

- None of the above conditions are met
- Receives a triage comment with next review date

## Compliance

All actions are mapped to:
- **SOC2.AC-2**: Access Control
- **NIST.AC-1**: Access Control Policy and Procedures  
- **ISO.9.2.1**: Management Review

Evidence artifacts follow the same format as other evidence files in the repository and can be audited for compliance purposes.

## Security

- Uses `gh` CLI with GitHub token authentication
- Dry run mode available for testing
- All actions logged and traceable
- Evidence artifacts include SHA-256 hashes for integrity

## Files

- `.github/workflows/issue-triage.yml`: GitHub Actions workflow
- `scripts/triage-issues.mjs`: Main triage script
- `artifacts/EV-issue-*.json`: Evidence artifacts
- `artifacts/triage-summary.md`: Summary report
- `artifacts/triage-trace-*.log`: Execution logs
