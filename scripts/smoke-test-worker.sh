#!/usr/bin/env bash
set -euo pipefail

# scripts/smoke-test-worker.sh
# Usage: ./scripts/smoke-test-worker.sh <worker_url>

WORKER_URL="${1:-}"
if [[ -z "$WORKER_URL" ]]; then
  echo "Usage: $0 <worker_url>"
  echo "Example: $0 https://project-ignite.example.com/health"
  exit 2
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL")
if [[ "$STATUS" == "200" ]]; then
  echo "✅ Worker is live: HTTP 200 OK"
  exit 0
elif [[ "$STATUS" == "502" ]]; then
  echo "⚠️  Worker dispatch error: HTTP 502 (likely no sub-worker bound)"
  exit 1
else
  echo "❌ Unexpected response: HTTP $STATUS"
  exit 1
fi
