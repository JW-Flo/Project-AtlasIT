#!/bin/bash
set -euo pipefail

# health-check-mcp.sh: Check if MCP dev server is healthy (port and HTTP check)
# Usage: ./scripts/health-check-mcp.sh

: "${USER?Need to set USER}"

PORT=8080
URL="http://127.0.0.1:$PORT/"

# Check if port is open
if ! lsof -i :$PORT | grep LISTEN >/dev/null; then
  echo "[ERROR] MCP dev server is not listening on port $PORT."
  exit 1
fi

# Check HTTP endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [[ "$HTTP_CODE" == "200" ]]; then
  echo "[OK] MCP dev server is healthy (HTTP 200 on $URL)"
  exit 0
else
  echo "[ERROR] MCP dev server unhealthy (HTTP $HTTP_CODE on $URL)"
  exit 1
fi 