#!/usr/bin/env bash
# Automate migration from GitHub Codespaces to local machine.
# Usage (run LOCALLY after copying this script):
#   scripts/migrate-from-codespaces.sh <codespaceName> [patchFileName]
# Example:
#   scripts/migrate-from-codespaces.sh twilight-river-a1b2 workspace-changes.patch
#
# Steps:
#  1. Clone repo if absent.
#  2. Fetch patch from Codespace if it exists.
#  3. Apply patch safely.
#  4. Install dependencies.
#  5. Run basic validation.
set -euo pipefail

CODESPACE="${1:-}"; PATCH_NAME="${2:-workspace-changes.patch}";
REPO_URL="https://github.com/JW-Flo/Project-AtlasIT.git"; REPO_DIR="Project-AtlasIT";

if [[ -z "${CODESPACE}" ]]; then
  echo "[migrate] Missing codespace name. Usage: scripts/migrate-from-codespaces.sh <codespaceName> [patchFileName]" >&2
  exit 1
fi

if [[ ! -d "${REPO_DIR}" ]]; then
  echo "[migrate] Cloning repository..." >&2
  git clone "${REPO_URL}" "${REPO_DIR}"
fi

# Attempt to copy patch; ignore failure.
echo "[migrate] Retrieving patch (if exists) from Codespace: ${CODESPACE}" >&2
if gh codespace cp "${CODESPACE}:/workspaces/Project-AtlasIT/${PATCH_NAME}" "${PATCH_NAME}" 2>/dev/null; then
  echo "[migrate] Patch downloaded: ${PATCH_NAME}" >&2
else
  echo "[migrate] Patch not found; continuing without it." >&2
fi

cd "${REPO_DIR}" || exit 1

if [[ -f "../${PATCH_NAME}" ]]; then
  echo "[migrate] Applying patch..." >&2
  if git apply --check "../${PATCH_NAME}" >/dev/null 2>&1; then
    git apply "../${PATCH_NAME}"
    echo "[migrate] Patch applied." >&2
  else
    echo "[migrate] Patch failed check. Review conflicts manually." >&2
  fi
fi

echo "[migrate] Installing dependencies (workspace aware)..." >&2
npm install --workspaces --include-workspace-root || npm install

echo "[migrate] Running typecheck (non-blocking)" >&2
npm run typecheck || echo "[migrate] Typecheck failed (review later)." >&2

echo "[migrate] Running unit tests (non-blocking)" >&2
npm run test:unit || echo "[migrate] Unit tests failed (review later)." >&2

echo "[migrate] Next steps:" >&2
echo "  cd ${REPO_DIR}" >&2
echo "  git add -A && git commit -m 'migrate: initial local import'" >&2
echo "  wrangler secret put <KEY> --env core (reseed secrets)" >&2
echo "  npm run dev:core" >&2
