#!/usr/bin/env bash
# Codex Continuous Evidence Cycle Script (CX-004)
# Automates recurring Codex environment validation and evidence generation
set -euo pipefail

# Initialize cycle log
echo "=== CODEX CONTINUOUS EVIDENCE CYCLE START ===" > ops/.codex.cycle
date -Iseconds >> ops/.codex.cycle
echo "" >> ops/.codex.cycle

# Configure git for automation
git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"

# 1. Sync latest branch state (skip reset to preserve CI context)
echo "--- Git Sync ---" >> ops/.codex.cycle
git fetch origin main >> ops/.codex.cycle 2>&1 || echo "WARNING: Fetch failed (may be running in detached state)" >> ops/.codex.cycle
echo "" >> ops/.codex.cycle

# 2. Run environment validation
echo "--- Environment Validation ---" >> ops/.codex.cycle
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/codex-validate-env.sh" >> ops/.codex.cycle 2>&1
validation_result=$?
echo "" >> ops/.codex.cycle

if [ $validation_result -ne 0 ]; then
  echo "ERROR: Validation failed with exit code $validation_result" >> ops/.codex.cycle
  echo "=== CODEX CONTINUOUS EVIDENCE CYCLE FAILED ===" >> ops/.codex.cycle
  exit $validation_result
fi

# 3. Emit evidence artifact
echo "--- Evidence Generation ---" >> ops/.codex.cycle
mkdir -p artifacts

# Generate UUID (fallback to date-based if uuidgen not available)
if command -v uuidgen &> /dev/null; then
  trace_id=$(uuidgen)
else
  # Portable fallback for systems without uuidgen (e.g., macOS)
  trace_id="$(date +%s)-${RANDOM:-$$}"
fi

timestamp=$(date -Iseconds)

cat > artifacts/EV-codex-cycle.json <<EOF
{
  "trace_id": "$trace_id",
  "control_id": "CX-004",
  "timestamp": "$timestamp",
  "result": "CYCLE_VALIDATED",
  "validation_script": "scripts/codex-validate-env.sh",
  "cycle_script": "scripts/codex-cycle.sh",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

echo "✓ Evidence artifact generated: artifacts/EV-codex-cycle.json" >> ops/.codex.cycle
echo "  Trace ID: $trace_id" >> ops/.codex.cycle
echo "  Timestamp: $timestamp" >> ops/.codex.cycle
echo "" >> ops/.codex.cycle

# 4. Commit evidence
echo "--- Git Commit ---" >> ops/.codex.cycle
git add ops/.codex.cycle artifacts/EV-codex-cycle.json >> ops/.codex.cycle 2>&1

if git diff --staged --quiet; then
  echo "No changes to commit" >> ops/.codex.cycle
else
  git commit -m "[AUTO] Codex continuous validation - CX-004 ($trace_id)" >> ops/.codex.cycle 2>&1 || echo "Commit skipped (no changes or error)" >> ops/.codex.cycle
  
  # Push changes (may fail in PR context, that's okay)
  git push >> ops/.codex.cycle 2>&1 || echo "Push skipped (non-interactive CI or no permissions)" >> ops/.codex.cycle
fi

echo "" >> ops/.codex.cycle
echo "=== CODEX CONTINUOUS EVIDENCE CYCLE COMPLETE ===" >> ops/.codex.cycle
date -Iseconds >> ops/.codex.cycle

# Display cycle log
echo ""
echo "Cycle completed successfully. Log contents:"
echo ""
cat ops/.codex.cycle
