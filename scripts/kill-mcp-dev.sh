#!/bin/bash
set -euo pipefail

# kill-mcp-dev.sh: Safely kill all wrangler dev processes for MCP local dev
# Usage: ./scripts/kill-mcp-dev.sh

: "${USER?Need to set USER}"

echo "[INFO] Stopping all wrangler dev processes for MCP..."

pkill -f 'wrangler dev' && echo "[INFO] All wrangler dev processes stopped." || echo "[INFO] No wrangler dev processes found." 