#!/usr/bin/env bash
# API Key Rotation Script for AtlasIT
# Usage: ./scripts/rotate-secrets.sh [--dry-run] [--worker <name>]
#
# Rotates API keys using 1Password CLI + wrangler secret put
# Requires: op CLI authenticated, wrangler CLI authenticated
#
# Targets: ONBOARDING_API_KEY, ORCHESTRATOR_API_KEY, GROQ_API_KEY, SLACK_WEBHOOK_URL
# Log:     ops/rotation-log.jsonl

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OP_MAP="$REPO_ROOT/ops/secrets/op-map.json"
ROTATION_LOG="$REPO_ROOT/ops/rotation-log.jsonl"

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()    { printf "${GREEN}[%s] INFO  %s${NC}\n"    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
log_warn()    { printf "${YELLOW}[%s] WARN  %s${NC}\n"   "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
log_error()   { printf "${RED}[%s] ERROR %s${NC}\n"      "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
log_dry_run() { printf "${YELLOW}[%s] DRY   %s${NC}\n"   "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
DRY_RUN=false
FILTER_WORKER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --worker)
      FILTER_WORKER="$2"
      shift 2
      ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--dry-run] [--worker <name>]

  --dry-run          Show what would happen without making any changes.
  --worker <name>    Rotate secrets for a specific worker only.
                     Valid names: core-api, ai-orchestrator, compliance-worker,
                                  onboarding, slack-notification-agent

Examples:
  $0 --dry-run
  $0 --worker onboarding
  $0 --dry-run --worker ai-orchestrator
EOF
      exit 0
      ;;
    *)
      log_error "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
if ! command -v op >/dev/null 2>&1; then
  log_error "'op' CLI not found. Install from https://developer.1password.com/docs/cli"
  exit 1
fi

if ! command -v wrangler >/dev/null 2>&1; then
  log_error "'wrangler' CLI not found. Install with: npm install -g wrangler"
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  log_error "'openssl' not found. Install via system package manager."
  exit 1
fi

# Verify op is authenticated
if ! op account list >/dev/null 2>&1; then
  log_error "1Password CLI is not authenticated. Run: op signin"
  exit 1
fi

# Verify wrangler is authenticated
if ! wrangler whoami >/dev/null 2>&1; then
  log_error "Wrangler is not authenticated. Run: wrangler login"
  exit 1
fi

if [[ ! -f "$OP_MAP" ]]; then
  log_error "op-map.json not found at: $OP_MAP"
  exit 1
fi

# ---------------------------------------------------------------------------
# Secret rotation targets
#
# Format: SECRET_NAME|op_vault|op_item|op_field|worker1,worker2,...
#
# SLACK_WEBHOOK_URL and GROQ_API_KEY are not regenerated here — they are
# third-party credentials. The script updates them in workers from 1Password.
# ONBOARDING_API_KEY and ORCHESTRATOR_API_KEY are internally generated keys
# that get a new value on each rotation.
# ---------------------------------------------------------------------------

# Each entry: "SECRET_NAME|OP_VAULT|OP_ITEM|OP_FIELD|WORKERS|GENERATE_NEW"
# GENERATE_NEW=true  → generate new key with openssl, write to 1P, push to workers
# GENERATE_NEW=false → read current value from 1P, push to workers (re-sync)
ROTATION_TARGETS=(
  "ONBOARDING_API_KEY|AWW_SHARED|ONBOARDING_API_KEY|password|onboarding,ai-orchestrator|true"
  "ORCHESTRATOR_API_KEY|AWW_SHARED|ORCHESTRATOR_API_KEY|password|ai-orchestrator,core-api|true"
  "GROQ_API_KEY|AWW_SHARED|Groq Atlas IT API Credentials|credential|ai-orchestrator,compliance-worker|false"
  "SLACK_WEBHOOK_URL|AWW_SHARED|Slack Webhook|url|slack-notification-agent|false"
)

# Worker → directory mapping (relative to repo root)
declare -A WORKER_DIR=(
  [core-api]="core-api"
  [ai-orchestrator]="ai-orchestrator"
  [compliance-worker]="compliance-worker"
  [onboarding]="onboarding"
  [slack-notification-agent]="slack-notification-agent"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

jsonl_log() {
  local secret="$1"
  local worker="$2"
  local status="$3"
  local detail="${4:-}"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '{"timestamp":"%s","secret":"%s","worker":"%s","status":"%s","detail":"%s","dry_run":%s}\n' \
    "$ts" "$secret" "$worker" "$status" "$detail" "$DRY_RUN" \
    >> "$ROTATION_LOG"
}

push_secret_to_worker() {
  local secret_name="$1"
  local worker="$2"
  local value="$3"

  local dir="${WORKER_DIR[$worker]:-}"
  if [[ -z "$dir" ]]; then
    log_warn "  Unknown worker '$worker' — skipping"
    jsonl_log "$secret_name" "$worker" "skipped" "unknown worker"
    return
  fi

  local worker_path="$REPO_ROOT/$dir"
  if [[ ! -d "$worker_path" ]]; then
    log_warn "  Worker directory not found: $worker_path — skipping"
    jsonl_log "$secret_name" "$worker" "skipped" "directory not found"
    return
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log_dry_run "  Would push $secret_name → $worker ($worker_path)"
    jsonl_log "$secret_name" "$worker" "dry_run" "would push"
    return
  fi

  log_info "  Pushing $secret_name → $worker"
  # Pipe value; never expose in shell history or process list
  if printf '%s' "$value" | (cd "$worker_path" && wrangler secret put "$secret_name" --env production) >/dev/null 2>&1; then
    log_info "  OK: $secret_name set on $worker"
    jsonl_log "$secret_name" "$worker" "success" "pushed to production"
  else
    log_error "  FAILED: $secret_name on $worker"
    jsonl_log "$secret_name" "$worker" "error" "wrangler secret put failed"
    return 1
  fi
}

update_op_item() {
  local vault="$1"
  local item="$2"
  local field="$3"
  local value="$4"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_dry_run "  Would update 1Password: op://$vault/$item/$field"
    return
  fi

  log_info "  Updating 1Password: op://$vault/$item/$field"
  if op item edit "$item" --vault "$vault" "${field}=${value}" >/dev/null 2>&1; then
    log_info "  OK: 1Password updated"
  else
    log_error "  FAILED to update 1Password item '$item' field '$field'"
    return 1
  fi
}

read_op_field() {
  local vault="$1"
  local item="$2"
  local field="$3"
  op item get "$item" --vault "$vault" --field "$field" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Main rotation loop
# ---------------------------------------------------------------------------

TOTAL=0
SUCCESS=0
ERRORS=0

log_info "Starting AtlasIT secret rotation"
[[ "$DRY_RUN" == "true" ]] && log_warn "DRY RUN mode — no changes will be made"
[[ -n "$FILTER_WORKER" ]] && log_info "Filtering to worker: $FILTER_WORKER"

for target in "${ROTATION_TARGETS[@]}"; do
  IFS='|' read -r secret_name op_vault op_item op_field workers_csv generate_new <<< "$target"

  TOTAL=$((TOTAL + 1))
  log_info "--- Rotating: $secret_name ---"

  # Build list of workers to update, applying --worker filter
  IFS=',' read -ra workers <<< "$workers_csv"
  filtered_workers=()
  for w in "${workers[@]}"; do
    if [[ -z "$FILTER_WORKER" || "$w" == "$FILTER_WORKER" ]]; then
      filtered_workers+=("$w")
    fi
  done

  if [[ ${#filtered_workers[@]} -eq 0 ]]; then
    log_info "  No matching workers after filter — skipping $secret_name"
    continue
  fi

  # Determine new value
  new_value=""
  if [[ "$generate_new" == "true" ]]; then
    log_info "  Generating new key for $secret_name"
    if [[ "$DRY_RUN" == "true" ]]; then
      new_value="<would-generate-openssl-rand-hex-24>"
      log_dry_run "  New value: [redacted — would be openssl rand -hex 24]"
    else
      new_value="$(openssl rand -hex 24)"
      log_info "  New key generated (not logged)"
    fi

    # Update 1Password with new value
    if ! update_op_item "$op_vault" "$op_item" "$op_field" "$new_value"; then
      log_error "  Aborting rotation for $secret_name — 1Password update failed"
      ERRORS=$((ERRORS + 1))
      jsonl_log "$secret_name" "_all_" "error" "1password update failed"
      continue
    fi
  else
    # Read current value from 1Password
    log_info "  Reading current value from 1Password: op://$op_vault/$op_item/$op_field"
    if [[ "$DRY_RUN" == "true" ]]; then
      new_value="<would-read-from-1password>"
      log_dry_run "  Value: [redacted — would read from 1Password]"
    else
      new_value="$(read_op_field "$op_vault" "$op_item" "$op_field" || true)"
      if [[ -z "$new_value" ]]; then
        log_error "  Could not read $secret_name from 1Password (op://$op_vault/$op_item/$op_field)"
        ERRORS=$((ERRORS + 1))
        jsonl_log "$secret_name" "_all_" "error" "1password read failed"
        continue
      fi
      log_info "  Value read from 1Password (not logged)"
    fi
  fi

  # Push to each worker
  target_errors=0
  for worker in "${filtered_workers[@]}"; do
    if ! push_secret_to_worker "$secret_name" "$worker" "$new_value"; then
      target_errors=$((target_errors + 1))
    fi
  done

  if [[ $target_errors -eq 0 ]]; then
    log_info "  $secret_name rotation complete"
    SUCCESS=$((SUCCESS + 1))
  else
    log_error "  $secret_name had $target_errors worker push failure(s)"
    ERRORS=$((ERRORS + 1))
  fi

  # Small delay to avoid rate limits
  [[ "$DRY_RUN" == "false" ]] && sleep 0.5
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
log_info "=========================================="
log_info "Rotation complete"
log_info "  Total targets processed : $TOTAL"
log_info "  Successful              : $SUCCESS"
[[ $ERRORS -gt 0 ]] && log_error "  Errors                  : $ERRORS" || log_info "  Errors                  : $ERRORS"
log_info "  Log written to          : $ROTATION_LOG"
log_info "=========================================="

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi
