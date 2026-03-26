#!/usr/bin/env bash
# Export current workspace into a tarball excluding heavy or reproducible directories.
# Usage: ./scripts/export-workspace.sh [output-file]
# Default output: atlasit-export-$(date +%Y%m%d%H%M%S).tgz
set -euo pipefail
OUT=${1:-atlasit-export-$(date +%Y%m%d%H%M%S).tgz}
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT"

EXCLUDES=(
  node_modules
  .git
  **/.wrangler
  **/dist
  **/build
  **/.turbo
  **/.cache
  **/.next
  **/coverage
  **/playwright-report
)

ARGS=()
for p in "${EXCLUDES[@]}"; do
  ARGS+=(--exclude="$p")
done

echo "[export] Creating archive $OUT from $ROOT" >&2
tar -czf "$OUT" "${ARGS[@]}" .

echo "[export] Done. Size:" >&2
ls -lh "$OUT" >&2

echo "[export] To transfer from Codespaces: gh codespace cp <name>:$ROOT/$OUT ." >&2
