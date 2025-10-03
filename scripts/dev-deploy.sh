#!/usr/bin/env bash
set -euo pipefail

# Dev deploy script for AtlasIT (Cloudflare Workers + optional Pages)
# - Creates KV/D1/R2 (if missing) and writes IDs into wrangler.toml
# - Sets dev secrets (AWS_ENABLED=0, S3_MIRROR=0)
# - Applies D1 schema from schema/d1.sql (or scaffolds minimal tables)
# - Deploys Worker (wrangler deploy) and optionally Pages if build exists
# - Runs smoke against /healthz and /guardz and stores artifacts

WRANGLER_BIN="${WRANGLER_BIN:-wrangler}"
PROJECT_NAME="atlas-it"
ART_DIR="artifacts/deploy_dev"
PR_BODY="ops/pr-bodies/PR-DEPLOY-DEV.md"
ACTIVE_JSON="ops/codex-active-work.json"
TOML="wrangler.toml"

mkdir -p "$ART_DIR"
DEPLOY_LOG="$ART_DIR/deploy.log"
: > "$DEPLOY_LOG"

log() { echo "[$(date -Is)] $*" | tee -a "$DEPLOY_LOG"; }
fail() { echo "ERROR: $*" | tee -a "$DEPLOY_LOG" >&2; exit 1; }

command -v "$WRANGLER_BIN" >/dev/null 2>&1 || fail "wrangler CLI not found. Install: npm i -g wrangler"

ensure_kv() {
  if grep -q 'binding\s*=\s*"ATLAS_FLAGS"' "$TOML" && grep -q 'id\s*=\s*"[a-f0-9]\{32\}"' "$TOML"; then
    log "KV ATLAS_FLAGS already configured in wrangler.toml"
  else
    log "Creating KV namespace ATLAS_FLAGS..."
    KV_JSON=$($WRANGLER_BIN kv namespace create ATLAS_FLAGS --json 2>/dev/null || true)
    KV_ID=$(echo "$KV_JSON" | jq -r '.id // .result.id // empty')
    [[ -n "$KV_ID" ]] || fail "KV create failed. Remediation: wrangler kv namespace create ATLAS_FLAGS"
    log "KV id=$KV_ID"
    if grep -q 'binding\s*=\s*"ATLAS_FLAGS"' "$TOML"; then
      sed -i '' -E "s/(binding\s*=\s*\"ATLAS_FLAGS\"[\s\S]*?id\s*=\s*)\"[^\"]*\"/\\1\"$KV_ID\"/" "$TOML"
    else
      printf '\n[[kv_namespaces]]\nbinding = "ATLAS_FLAGS"\nid = "%s"\n' "$KV_ID" >> "$TOML"
    fi
  fi
}

ensure_d1() {
  if grep -q 'binding\s*=\s*"ATLAS_D1"' "$TOML" && grep -q 'database_id\s*=\s*"' "$TOML"; then
    log "D1 ATLAS_D1 already configured in wrangler.toml"
  else
    log "Creating D1 database atlasit_dev..."
    D1_JSON=$($WRANGLER_BIN d1 create atlasit_dev --json 2>/dev/null || true)
    D1_ID=$(echo "$D1_JSON" | jq -r '.uuid // .result.uuid // empty')
    [[ -n "$D1_ID" ]] || fail "D1 create failed. Remediation: wrangler d1 create atlasit_dev"
    log "D1 id=$D1_ID"
    {
      echo ""
      echo "[d1_databases]"
      echo "[[d1_databases]]"
      echo "binding = \"ATLAS_D1\""
      echo "database_name = \"atlasit_dev\""
      echo "database_id = \"$D1_ID\""
    } >> "$TOML"
  fi
}

ensure_r2() {
  log "Ensuring R2 bucket atlasit-evidence-dev..."
  $WRANGLER_BIN r2 bucket create atlasit-evidence-dev 2>/dev/null || true
}

ensure_dispatch() {
  if grep -q '\[\[dispatch_namespaces\]\]' "$TOML"; then
    log "Dispatch namespace binding present"
  else
    log "Adding dispatch namespace atlasit-dispatcher"
    printf '\n[[dispatch_namespaces]]\nbinding = "dispatcher"\nnamespace = "atlasit-dispatcher"\n' >> "$TOML"
  fi
}

apply_d1_schema() {
  if [[ -f schema/d1.sql ]]; then
    log "Applying D1 schema"
    $WRANGLER_BIN d1 execute atlasit_dev --file=schema/d1.sql | tee -a "$DEPLOY_LOG" || fail "D1 schema apply failed"
  else
    log "No schema/d1.sql found; skipping"
  fi
}

set_secrets() {
  log "Setting dev secrets (AWS_ENABLED=0, S3_MIRROR=0)"
  printf '0' | $WRANGLER_BIN secret put AWS_ENABLED >/dev/null
  printf '0' | $WRANGLER_BIN secret put S3_MIRROR >/dev/null
}

deploy_worker() {
  log "Deploying Worker"
  URL=$($WRANGLER_BIN deploy 2>&1 | tee -a "$DEPLOY_LOG" | awk '/https:\/\/.*workers\.dev/ {print $1; last=$1} END{print last}')
  echo "$URL"
}

deploy_pages() {
  if [[ -d build ]]; then
    log "Deploying Pages (build/)"
    PURL=$($WRANGLER_BIN pages deploy ./build --project-name "$PROJECT_NAME" 2>&1 | tee -a "$DEPLOY_LOG" | awk '/https:\/\/.*pages\.dev/ {print $1; last=$1} END{print last}')
    echo "$PURL"
  else
    log "No build/ directory; skipping Pages deploy"; echo ""
  fi
}

run_smoke() {
  local base="$1"
  if [[ -z "$base" ]]; then log "No URL for smoke; skipping"; return 0; fi
  export ATLAS_DEV_URL="$base"
  if [[ -x ops/checks/dev-smoke.sh ]]; then
    log "Running smoke against $base"
    ./ops/checks/dev-smoke.sh | tee -a "$DEPLOY_LOG"
  else
    fail "ops/checks/dev-smoke.sh missing or not executable"
  fi
}

update_docs() {
  local base="$1"
  if [[ -n "$base" && -f "$PR_BODY" ]]; then
    perl -0777 -pe "s#- Pages/Functions: <ATLAS_DEV_URL>#- Pages/Functions: ${base//\//\\/}#" -i "$PR_BODY"
  fi
  if [[ -f "$ACTIVE_JSON" ]]; then
    perl -0777 -pe 's/("title"\s*:\s*"Deploy AtlasIT to Cloudflare \(dev\)"[\s\S]*?"status"\s*:\s*")staged(\")/\1committed\2/' -i "$ACTIVE_JSON" || true
  fi
}

main() {
  log "Starting dev deploy for $PROJECT_NAME"
  ensure_kv
  ensure_d1
  ensure_r2
  ensure_dispatch
  set_secrets
  apply_d1_schema
  WORKER_URL=$(deploy_worker)
  PAGES_URL=$(deploy_pages)
  DEPLOYED_URL="${PAGES_URL:-$WORKER_URL}"
  log "Deployed URL: $DEPLOYED_URL"
  run_smoke "$DEPLOYED_URL"
  update_docs "$DEPLOYED_URL"
  log "Dev deploy complete"
}

main "$@"
