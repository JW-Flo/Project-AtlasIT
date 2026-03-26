#!/bin/bash
set -euo pipefail

# audit-mcp-dev.sh: Ensure MCP dev server is always running and healthy
# Usage: ./scripts/audit-mcp-dev.sh
# Sends a Slack alert for all state changes (healthy, recovered, fatal) if SLACK_WEBHOOK_URL is set.

: "${USER?Need to set USER}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_DIR="$SCRIPT_DIR/../mcp"
HEALTH_CHECK="$SCRIPT_DIR/health-check-mcp.sh"
KILL_SCRIPT="$SCRIPT_DIR/kill-mcp-dev.sh"

send_slack_alert() {
  local message="$1"
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    payload=$(jq -nc --arg text "$message" '{text: $text}')
    curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK_URL" && \
      echo "[ALERT] Slack notification sent: $message" || \
      echo "[ERROR] Failed to send Slack notification: $message"
  else
    echo "[WARN] SLACK_WEBHOOK_URL not set; cannot send Slack alert: $message"
  fi
}

TS=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
HOST=$(hostname)

if "$HEALTH_CHECK"; then
  MSG="[OK][Project Ignite MCP Auditor] $TS on $HOST: MCP dev server is healthy."
  echo "$MSG"
  send_slack_alert "$MSG"
  exit 0
else
  echo "[WARN] MCP dev server unhealthy. Attempting restart..."
  "$KILL_SCRIPT"
  cd "$MCP_DIR"
  nohup wrangler dev --port 8080 > _remote.log 2>&1 &
  sleep 3
  if "$HEALTH_CHECK"; then
    MSG="[RECOVERED][Project Ignite MCP Auditor] $TS on $HOST: MCP dev server was unhealthy but is now healthy after restart."
    echo "$MSG"
    send_slack_alert "$MSG"
    exit 0
  else
    MSG="[FATAL][Project Ignite MCP Auditor] $TS on $HOST: MCP dev server failed to restart. Manual intervention required."
    echo "$MSG"
    send_slack_alert "$MSG"
    exit 1
  fi
fi

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
