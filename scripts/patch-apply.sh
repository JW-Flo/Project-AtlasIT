#!/usr/bin/env bash
# Verify and apply a patch file (default workspace-changes.patch) safely.
# Usage: ./scripts/patch-apply.sh [patch-file]
set -euo pipefail
PATCH=${1:-workspace-changes.patch}
if [ ! -f "$PATCH" ]; then
  echo "[patch-apply] Patch file not found: $PATCH" >&2
  exit 1
fi
# Dry-run check
if ! git apply --check "$PATCH" 2>err.log; then
  echo "[patch-apply] Patch cannot be cleanly applied. See err.log" >&2
  cat err.log >&2
  exit 2
fi
rm -f err.log || true
# Apply
git apply "$PATCH"
# Show summary
echo "[patch-apply] Applied. Changed files:" >&2
git diff --name-only --staged || git ls-files -m
