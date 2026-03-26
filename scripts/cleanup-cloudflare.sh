#!/usr/bin/env bash
set -euo pipefail

# AtlasIT: Cloudflare Cleanup Script
# Run ONLY after confirming 100% AWS traffic and 2-week monitoring period
#
# Usage:
#   ./scripts/cleanup-cloudflare.sh --dry-run    # Show what would be deleted
#   ./scripts/cleanup-cloudflare.sh --execute    # Actually delete resources

MODE="${1:---dry-run}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[cleanup]${NC} $1"; }
warn() { echo -e "${YELLOW}[cleanup]${NC} $1"; }
danger() { echo -e "${RED}[cleanup]${NC} $1"; }

if [[ "$MODE" == "--execute" ]]; then
  danger "⚠️  DESTRUCTIVE MODE - This will permanently delete Cloudflare resources"
  read -r -p "Type 'DELETE ALL CLOUDFLARE RESOURCES' to confirm: " confirm
  if [[ "$confirm" != "DELETE ALL CLOUDFLARE RESOURCES" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Workers
# ---------------------------------------------------------------------------

WORKERS=(
  "compliance-worker"
  "console-app"
  "ai-orchestrator"
  "scheduler-worker"
  "dispatch-worker"
  "slack-approval-worker"
  "github-proxy"
  "onboarding"
  "mcp"
  "mcp-idp"
  "mcp-mobile"
  "documentation-worker"
)

log "Workers to delete: ${#WORKERS[@]}"
for worker in "${WORKERS[@]}"; do
  if [[ "$MODE" == "--execute" ]]; then
    log "Deleting worker: $worker"
    wrangler delete --name "$worker" --force 2>/dev/null || warn "Worker $worker not found or already deleted"
  else
    log "[DRY RUN] Would delete worker: $worker"
  fi
done

# ---------------------------------------------------------------------------
# D1 Databases
# ---------------------------------------------------------------------------

log "D1 databases to delete:"
if [[ "$MODE" == "--execute" ]]; then
  # List and delete D1 databases
  log "Listing D1 databases..."
  wrangler d1 list 2>/dev/null | while read -r line; do
    db_id=$(echo "$line" | awk '{print $1}')
    if [[ -n "$db_id" && "$db_id" != "id" ]]; then
      log "Deleting D1 database: $db_id"
      wrangler d1 delete "$db_id" --force 2>/dev/null || warn "D1 $db_id not found"
    fi
  done
else
  log "[DRY RUN] Would delete all D1 databases (use 'wrangler d1 list' to see)"
fi

# ---------------------------------------------------------------------------
# KV Namespaces
# ---------------------------------------------------------------------------

log "KV namespaces to delete:"
if [[ "$MODE" == "--execute" ]]; then
  wrangler kv namespace list 2>/dev/null | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | while read -r ns_id; do
    log "Deleting KV namespace: $ns_id"
    wrangler kv namespace delete --namespace-id "$ns_id" --force 2>/dev/null || warn "KV $ns_id not found"
  done
else
  log "[DRY RUN] Would delete all KV namespaces"
fi

# ---------------------------------------------------------------------------
# R2 Buckets
# ---------------------------------------------------------------------------

log "R2 buckets to delete:"
if [[ "$MODE" == "--execute" ]]; then
  warn "R2 buckets must be emptied before deletion"
  warn "Skipping R2 cleanup — manually empty and delete via Cloudflare dashboard"
else
  log "[DRY RUN] Would delete R2 buckets (manual step required)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
if [[ "$MODE" == "--execute" ]]; then
  log "Cloudflare cleanup complete"
  echo ""
  warn "Remaining manual steps:"
  warn "  1. Empty and delete R2 buckets via Cloudflare dashboard"
  warn "  2. Remove DNS records pointing to Cloudflare workers"
  warn "  3. Cancel Cloudflare plan if no longer needed"
else
  log "Dry run complete. Re-run with --execute to perform cleanup."
fi
