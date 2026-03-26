#!/usr/bin/env bash
# Quick environment surface check for local / devcontainer setup.
set -euo pipefail

fail() { echo "[env-check] ERROR: $*" >&2; exit 1; }

printf "[env-check] Node:    "
command -v node >/dev/null 2>&1 || fail "node not found";
node --version

printf "[env-check] npm:     "
command -v npm >/dev/null 2>&1 || fail "npm not found";
npm --version

printf "[env-check] git:     "
command -v git >/dev/null 2>&1 || fail "git not found";
git --version | awk '{print $3}' || true

printf "[env-check] wrangler:";
if command -v wrangler >/dev/null 2>&1; then
  wrangler --version
else
  echo "(not installed)";
fi

# Minimum Node major version check (>=18)
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node major version <18 (found $NODE_MAJOR)"
fi

# Check key directories exist
for dir in onboarding ai-orchestrator documentation-worker packages/shared; do
  if [ ! -d "$dir" ]; then
    echo "[env-check] WARNING: expected directory missing: $dir" >&2
  fi
done

echo "[env-check] OK: baseline environment checks passed." >&2
