#!/bin/bash

set -euo pipefail

# Function to send a message to Slack
send_slack_alert() {
  local message="$1"
  local webhook_url="https://hooks.slack.com/services/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"

  # JSON payload
  payload=$(cat <<EOF
{
  "text": "${message}"
}
EOF
)

  # Send the message
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H 'Content-type: application/json' --data "${payload}" "${webhook_url}")

  if [ "$response" -ne 200 ]; then
    echo "[ERROR] Failed to send alert to Slack. HTTP response code: $response"
    exit 1
  fi

  echo "[INFO] Alert sent to Slack successfully."
}

# Example usage
 