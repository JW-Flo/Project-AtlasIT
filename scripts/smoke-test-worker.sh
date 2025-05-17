#!/usr/bin/env bash
set -euo pipefail

# scripts/smoke-test-worker.sh
# Usage: ./scripts/smoke-test-worker.sh <worker_url>

: "${WORKER_URL?Need to set WORKER_URL}"

echo "Running smoke test against $WORKER_URL..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "✅ Smoke test passed: HTTP 200 received."
  exit 0
else
  echo "❌ Smoke test failed: Got HTTP $HTTP_CODE."
  exit 1
fi
