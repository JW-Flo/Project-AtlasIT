#!/usr/bin/env bash
set -euo pipefail

# rotate-admin-token.sh
# Generates a new DISPATCH_ADMIN_TOKEN and deploys it to all workers that use it.
#
# Prerequisites:
#   - wrangler CLI authenticated (wrangler login or CLOUDFLARE_API_TOKEN set)
#   - jq installed
#
# Usage:
#   ./scripts/rotate-admin-token.sh
#   ./scripts/rotate-admin-token.sh --dry-run   # show what would happen

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "[DRY RUN] No secrets will be changed."
fi

# Workers that consume DISPATCH_ADMIN_TOKEN
WORKERS=(
  "atlasit-dispatch"
  "atlasit-console"
)

# Generate a cryptographically random 48-byte hex token
NEW_TOKEN=$(openssl rand -hex 48)

echo "=== DISPATCH_ADMIN_TOKEN Rotation ==="
echo "New token generated (first 8 chars): ${NEW_TOKEN:0:8}..."
echo ""

for worker in "${WORKERS[@]}"; do
  echo "Rotating secret for worker: $worker"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would run: printf '%s' '<token>' | npx wrangler secret put DISPATCH_ADMIN_TOKEN --name $worker"
  else
    printf '%s' "$NEW_TOKEN" | npx wrangler secret put DISPATCH_ADMIN_TOKEN --name "$worker"
    echo "  Done."
  fi
done

echo ""
echo "=== Rotation complete ==="
echo ""
echo "IMPORTANT: Do NOT commit this token anywhere."
echo "If you need to store it for local testing, use:"
echo "  op item edit 'Dispatch Admin Token' password='$NEW_TOKEN' --vault AWW_SHARED"
echo ""
echo "Verify with:"
for worker in "${WORKERS[@]}"; do
  echo "  npx wrangler secret list --name $worker | grep DISPATCH_ADMIN_TOKEN"
done
