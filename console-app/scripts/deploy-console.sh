#!/usr/bin/env bash
set -euo pipefail

# Deploy script for AtlasIT Console (Cloudflare Workers via SvelteKit adapter)
# Requirements: `wrangler` authenticated (wrangler login) and real resource IDs in wrangler.toml
# Usage: ./scripts/deploy-console.sh [--dry-run]

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[deploy] Building SvelteKit project"
npm run build --silent

if $DRY_RUN; then
  echo "[deploy] Performing wrangler dry-run"
  wrangler deploy --dry-run
  echo "[deploy] Dry-run complete"
  exit 0
fi

echo "[deploy] Publishing worker"
wrangler deploy --var DEPLOY_TS:$(date -u +%Y%m%dT%H%M%SZ)

# Capture deployment URL from wrangler output (best-effort)
URL_LINE=$(wrangler routes list 2>/dev/null | grep -E "atlasit-console" || true)
if [[ -z "$URL_LINE" ]]; then
  echo "[deploy] NOTE: Could not auto-detect route. Fetching whoami to infer preview URL." >&2
fi

# Health check (fallback to workers.dev)
HEALTH_URL=${HEALTH_URL_OVERRIDE:-"https://atlasit-console.${CF_ACCOUNT_ID:-}.workers.dev/api/health"}

# If user provided explicit URL, prefer it
if [[ -n "${CONSOLE_URL:-}" ]]; then
  HEALTH_URL="${CONSOLE_URL%/}/api/health"
fi

echo "[deploy] Probing health at: $HEALTH_URL"
set +e
RESP=$(curl -s --max-time 10 "$HEALTH_URL")
CODE=$?
set -e
if [[ $CODE -ne 0 || -z "$RESP" ]]; then
  echo "[deploy] WARNING: Health probe failed (exit=$CODE). Inspect logs or confirm correct URL." >&2
  exit 1
fi

echo "$RESP" | jq '.' 2>/dev/null || echo "$RESP"

if echo "$RESP" | grep -q '"status":"ok"'; then
  echo "[deploy] SUCCESS: Health endpoint OK"
else
  echo "[deploy] ERROR: Health endpoint did not report status ok" >&2
  exit 1
fi

