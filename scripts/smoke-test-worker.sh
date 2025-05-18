#!/usr/bin/env bash
set -euo pipefail

# scripts/smoke-test-worker.sh
# Usage: ./scripts/smoke-test-worker.sh <worker_url>

: "${WORKER_URL?Need to set WORKER_URL}"

echo "Running smoke test against $WORKER_URL..."

# Test /deploy endpoint
DEPLOY_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_URL/deploy" \
  -H 'Content-Type: application/json' \
  -d '{"services":["test-service"]}')

echo "/deploy endpoint returned HTTP $DEPLOY_CODE"
if [[ "$DEPLOY_CODE" != "200" ]]; then
  echo "❌ /deploy endpoint failed."
  exit 1
fi

echo "✅ /deploy endpoint passed."

# Test /documentation endpoint
DOC_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_URL/documentation" \
  -H 'Content-Type: application/json' \
  -d '{"services":["test-service"]}')

echo "/documentation endpoint returned HTTP $DOC_CODE"
if [[ "$DOC_CODE" != "200" ]]; then
  echo "❌ /documentation endpoint failed."
  exit 1
fi

echo "✅ /documentation endpoint passed."

echo "🎉 All smoke tests passed."
