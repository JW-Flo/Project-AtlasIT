#!/usr/bin/env bash
set -euo pipefail

# Smoke test all AWS-deployed services
# Usage: ./scripts/smoke-test-aws.sh [env]
# Discovers endpoints from SSM Parameter Store or Terraform outputs

ENV="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FAILURES=0

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}=== AtlasIT AWS Smoke Tests (env: $ENV) ===${RESET}"
echo ""

# Discover API Gateway URL
API_URL=$(aws ssm get-parameter --name "/atlasit/${ENV}/api-gateway-url" \
  --query "Parameter.Value" --output text 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
  echo "Could not discover API Gateway URL from SSM. Trying terraform output..."
  API_URL=$(cd infra/aws && terraform output -raw api_gateway_url 2>/dev/null || echo "")
fi

if [ -z "$API_URL" ]; then
  echo "ERROR: Cannot discover API Gateway URL. Set SSM param /atlasit/${ENV}/api-gateway-url"
  exit 1
fi

echo "API Gateway: $API_URL"

# Discover CloudFront URL
CF_DIST_ID=$(aws ssm get-parameter --name "/atlasit/${ENV}/cloudfront-distribution-id" \
  --query "Parameter.Value" --output text 2>/dev/null || echo "")
if [ -n "$CF_DIST_ID" ]; then
  CF_DOMAIN=$(aws cloudfront get-distribution --id "$CF_DIST_ID" \
    --query "Distribution.DomainName" --output text 2>/dev/null || echo "")
  echo "CloudFront:  https://$CF_DOMAIN"
fi

echo ""

# --- Test each Lambda-backed service ---

run_test() {
  local NAME="$1"
  local URL="$2"
  local EXPECTED="${3:-200}"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$URL" 2>/dev/null || echo "000")

  if [ "$STATUS" = "$EXPECTED" ]; then
    echo -e "  ${GREEN}[PASS]${RESET} $NAME → $STATUS"
  else
    echo -e "  ${RED}[FAIL]${RESET} $NAME → $STATUS (expected $EXPECTED)"
    FAILURES=$((FAILURES + 1))
  fi
}

echo "--- API Gateway Endpoints ---"
run_test "health"                "$API_URL/health"
run_test "core-api /api/health"  "$API_URL/api/health"

echo ""
echo "--- Lambda Functions (via API Gateway) ---"
run_test "core-api"        "$API_URL/api/v1/core/status"    "401"
run_test "compliance-api"  "$API_URL/api/compliance/health"
run_test "orchestrator"    "$API_URL/orchestrator/health"
run_test "onboarding"      "$API_URL/api/onboarding/health"

echo ""
echo "--- CloudFront (if available) ---"
if [ -n "$CF_DOMAIN" ]; then
  run_test "cloudfront-health" "https://$CF_DOMAIN/health"
  run_test "cloudfront-static" "https://$CF_DOMAIN/"
else
  echo "  [SKIP] CloudFront not configured"
fi

echo ""
echo "--- Infrastructure ---"

# Aurora connectivity (check via Lambda health that includes DB)
AURORA_EP=$(aws ssm get-parameter --name "/atlasit/${ENV}/aurora-endpoint" \
  --query "Parameter.Value" --output text 2>/dev/null || echo "")
if [ -n "$AURORA_EP" ]; then
  echo -e "  ${GREEN}[INFO]${RESET} Aurora endpoint: $AURORA_EP"
else
  echo -e "  ${RED}[WARN]${RESET} Aurora endpoint not in SSM"
fi

# SQS queue depth
SQS_URL=$(aws ssm get-parameter --name "/atlasit/${ENV}/sqs-step-tasks-url" \
  --query "Parameter.Value" --output text 2>/dev/null || echo "")
if [ -n "$SQS_URL" ]; then
  QUEUE_DEPTH=$(aws sqs get-queue-attributes --queue-url "$SQS_URL" \
    --attribute-names ApproximateNumberOfMessages \
    --query "Attributes.ApproximateNumberOfMessages" --output text 2>/dev/null || echo "?")
  echo -e "  ${GREEN}[INFO]${RESET} SQS step-tasks queue depth: $QUEUE_DEPTH"
fi

# DLQ depth
DLQ_DEPTH=$(aws sqs get-queue-attributes \
  --queue-url "${SQS_URL/step-tasks/step-tasks-dlq}" \
  --attribute-names ApproximateNumberOfMessages \
  --query "Attributes.ApproximateNumberOfMessages" --output text 2>/dev/null || echo "?")
if [ "$DLQ_DEPTH" != "?" ] && [ "$DLQ_DEPTH" -gt 0 ] 2>/dev/null; then
  echo -e "  ${RED}[WARN]${RESET} DLQ has $DLQ_DEPTH messages!"
  FAILURES=$((FAILURES + 1))
else
  echo -e "  ${GREEN}[INFO]${RESET} DLQ depth: ${DLQ_DEPTH}"
fi

echo ""
echo -e "${BOLD}=== Results ===${RESET}"
if [ "$FAILURES" -eq 0 ]; then
  echo -e "${GREEN}All checks passed${RESET}"
else
  echo -e "${RED}$FAILURES check(s) failed${RESET}"
fi
exit "$FAILURES"
