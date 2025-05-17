#!/usr/bin/env bash
set -euo pipefail

: "${AI_WORKER_URL?Need to set AI_WORKER_URL}"
: "${AI_GATEWAY_TOKEN?Need to set AI_GATEWAY_TOKEN}"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$AI_WORKER_URL" \
  --header "Authorization: Bearer $AI_GATEWAY_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"prompt": "What is Cloudflare?"}')

if [[ "$RESPONSE" == "200" ]]; then
  echo "✅ AI Worker smoke test passed: HTTP 200 received."
  exit 0
elif [[ "$RESPONSE" == "401" || "$RESPONSE" == "403" ]]; then
  echo "⚠️  AI Worker smoke test: Unauthorized (HTTP $RESPONSE). Check token."
  exit 0
else
  echo "❌ AI Worker smoke test failed: Got HTTP $RESPONSE."
  exit 1
fi
