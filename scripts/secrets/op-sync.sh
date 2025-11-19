#!/usr/bin/env bash
# Sync selected secrets from 1Password CLI into Wrangler secrets for a target env.
# Usage:
#   OP_VAULT="AtlasIT" WRANGLER_ENV="core" ./scripts/secrets/op-sync.sh
# Requires:
#   - Logged in via `op signin`
#   - Items exist in specified vault with matching names or custom mapping below.
# Safe patterns:
#   - Read-only: does not modify 1Password items.
#   - Avoids echoing secret values to terminal; pipes directly to wrangler.
set -euo pipefail

VAULT=${OP_VAULT:-AtlasIT}
WRANGLER_ENV=${WRANGLER_ENV:-core}

if ! command -v op >/dev/null 2>&1; then
  echo "[op-sync] 1Password CLI 'op' is not installed or not on PATH" >&2
  exit 1
fi
if ! command -v wrangler >/dev/null 2>&1; then
  echo "[op-sync] Wrangler CLI not found; install with 'npm install -g wrangler'" >&2
  exit 1
fi

# Mapping: 1Password Item Title -> Wrangler Secret Name
# Extend cautiously; keep keys stable.
declare -A MAP=(
  [AI_GATEWAY_TOKEN]=AI_GATEWAY_TOKEN
  [SLACK_WEBHOOK_URL]=SLACK_WEBHOOK_URL
  [ORCHESTRATOR_API_KEY]=ORCHESTRATOR_API_KEY
  [ONBOARDING_API_KEY]=ONBOARDING_API_KEY
)

function fetch_item_field() {
  local item="$1" field="$2"
  # Attempt value field; fallback to password if structured item
  op item get "$item" --vault "$VAULT" --field "$field" 2>/dev/null || true
}

UPDATED=0
for ITEM in "${!MAP[@]}"; do
  SECRET_NAME="${MAP[$ITEM]}"
  VALUE=$(fetch_item_field "$ITEM" value)
  if [ -z "$VALUE" ]; then
    VALUE=$(fetch_item_field "$ITEM" password)
  fi
  if [ -z "$VALUE" ]; then
    echo "[op-sync] Skipping '$ITEM' (no value/password field)" >&2
    continue
  fi
  echo "[op-sync] Setting Wrangler secret '$SECRET_NAME' for env '$WRANGLER_ENV'" >&2
  # Pipe to wrangler to avoid shell history exposure
  printf "%s" "$VALUE" | wrangler secret put "$SECRET_NAME" --env "$WRANGLER_ENV" >/dev/null
  UPDATED=$((UPDATED+1))
  sleep 0.2
done

echo "[op-sync] Completed. Secrets updated: $UPDATED" >&2
