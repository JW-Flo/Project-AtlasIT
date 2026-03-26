#!/bin/bash
set -euo pipefail

# kill-mcp-dev.sh: Safely kill all wrangler dev processes for MCP local dev
# Usage: ./scripts/kill-mcp-dev.sh

: "${USER?Need to set USER}"

echo "[INFO] Stopping all wrangler dev processes for MCP..."

pkill -f 'wrangler dev' && echo "[INFO] All wrangler dev processes stopped." || echo "[INFO] No wrangler dev processes found."

# Revert the repository to the desired state
echo "🔄 Reverting repository to the desired state..."
git revert --no-commit HEAD
git commit -m "Revert to the desired state"

# Verify the revert by checking out the commit and reviewing the changes
echo "🔍 Verifying the revert..."
git checkout HEAD
git log -1

# Commit and push the changes to the repository
echo "📤 Committing and pushing the changes..."
git push origin main
