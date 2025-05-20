#!/bin/bash
set -euo pipefail

# scripts/smoke-test-worker.sh
# Usage: ./scripts/smoke-test-worker.sh <worker_url>

: "${MCP_URL?Need to set MCP_URL (e.g. https://your-mcp.workers.dev)}"
: "${SLACK_WEBHOOK_URL?Need to set SLACK_WEBHOOK_URL}"

echo "[INFO] Smoke test started at $(date -u)"

echo "[STEP] Checking MCP dashboard endpoint..."
curl -fsSL "$MCP_URL/cicd" | grep -qi 'pause' && echo "[PASS] Dashboard is up" || { echo "[FAIL] Dashboard not responding"; exit 1; }

echo "[STEP] Testing MCP pause endpoint..."
curl -fsSL -X POST "$MCP_URL/api/pause" | grep -qi 'paused' && echo "[PASS] Pause works" || { echo "[FAIL] Pause failed"; exit 1; }

echo "[STEP] Testing MCP resume endpoint..."
curl -fsSL -X POST "$MCP_URL/api/resume" | grep -qi 'resumed' && echo "[PASS] Resume works" || { echo "[FAIL] Resume failed"; exit 1; }

echo "[STEP] Checking Slack status integration..."
if curl -fsSL "$MCP_URL/api/last-slack-status" | grep -qi "$SLACK_WEBHOOK_URL"; then
  echo "[PASS] Slack status update detected"
else
  echo "[FAIL] No recent Slack status update"
  exit 1
fi

echo "[STEP] Verifying all code is committed..."
git diff --exit-code && echo "[PASS] No uncommitted changes" || { echo "[FAIL] Uncommitted changes found"; exit 1; }

echo "[STEP] Linting index.js and workflow YAML..."
npm run lint && echo "[PASS] Lint passed" || { echo "[FAIL] Lint failed"; exit 1; }

echo "[STEP] Verifying only allowed files changed..."
if git diff --name-only | grep -vE '^wrangler\.toml$|^index\.js$|^scripts/|^\.github/workflows/cloudflare-workers\.yml$' | grep .; then
  echo "[FAIL] Out-of-scope files changed"
  exit 1
else
  echo "[PASS] Only allowed files changed"
fi

echo "[SUCCESS] All checks passed at $(date -u)"

