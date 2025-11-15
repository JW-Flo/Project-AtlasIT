# Drift Detection Specification

## Purpose
Detect drift from the autonomous framework manifest to ensure all required files and directories remain present and valid.

## Mechanism
The drift scanner (`scripts/drift-scan.ts`) validates the repository against `FRAMEWORK_MANIFEST.json`:

1. Reads `FRAMEWORK_MANIFEST.json`
2. Checks existence of all `required_files`
3. Checks existence of all `required_directories`
4. Emits evidence artifact with results
5. Returns non-zero exit code on drift

## Execution
- **CI Integration**: Runs in enhanced CI workflow after build/test
- **Manual**: `npm run drift:scan`
- **Pre-commit**: Optional via git hooks

## Output
**JSON Result:**
```json
{
  "clean": false,
  "missing_files": ["policies/grammar.rego"],
  "missing_directories": [],
  "total_missing": 1,
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

**Evidence Artifact:**
```json
{
  "trace_id": "uuid",
  "control_id": "DRIFT-SCAN",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "result": "fail",
  "metadata": { ... }
}
```

## Exit Codes
- `0`: No drift detected
- `1`: Drift detected or scan error

## Remediation
When drift is detected:
1. Review `missing_files` and `missing_directories`
2. Restore missing files from framework template
3. Re-run drift scan to verify
4. Commit restoration with evidence tag
