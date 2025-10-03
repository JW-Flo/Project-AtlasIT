#!/usr/bin/env bash
set -euo pipefail

BASE="${ATLAS_DEV_URL:-}"
if [[ -z "$BASE" ]]; then
  echo "ATLAS_DEV_URL is required (e.g., https://atlas-it.pages.dev)" >&2
  exit 2
fi

log_dir="artifacts/deploy_dev"
mkdir -p "$log_dir"

{
  echo "Smoke start: $(date -Is)"
  v=$(curl -fsSL "$BASE/healthz" | jq -r '.version')
  echo "health.version=$v"
  curl -fsSI "$BASE/healthz" >/dev/null
  b=$(curl -fsS "$BASE/guardz" | jq -r '.bindingsOk | @json')
  echo "bindingsOk=$b"
  # connectors should be off by default
  if curl -fsSI "$BASE/api/connectors" | grep -Eq '404|204'; then
    echo "connectors=off"
  else
    echo "connectors=unexpected"
    exit 1
  fi
  echo "SMOKE_OK"
} | tee "$log_dir/smoke.log"

# bindings snapshot (best effort)
curl -fsS "$BASE/guardz" | jq . > "$log_dir/bindings.json" || true
