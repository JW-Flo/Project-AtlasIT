#!/usr/bin/env bash
set -euo pipefail

# Run k6 load tests against AWS-deployed endpoints
# Usage: ./scripts/k6-aws.sh [env] [test]
# Examples:
#   ./scripts/k6-aws.sh staging           # run all tests against staging
#   ./scripts/k6-aws.sh dev smoke-slo     # run smoke-slo against dev
#   ./scripts/k6-aws.sh staging load-baseline

ENV="${1:-dev}"
TEST="${2:-smoke-slo}"

echo "==> k6 load test: $TEST (env: $ENV)"

# Discover API Gateway URL from SSM
API_URL=$(aws ssm get-parameter --name "/atlasit/${ENV}/api-gateway-url" \
  --query "Parameter.Value" --output text 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
  echo "ERROR: Cannot discover API Gateway URL from SSM /atlasit/${ENV}/api-gateway-url"
  echo "       Deploy infrastructure first: gh workflow run terraform-apply.yml -f environment=$ENV"
  exit 1
fi

# Discover CloudFront domain
CF_DIST_ID=$(aws ssm get-parameter --name "/atlasit/${ENV}/cloudfront-distribution-id" \
  --query "Parameter.Value" --output text 2>/dev/null || echo "")
CF_URL=""
if [ -n "$CF_DIST_ID" ]; then
  CF_DOMAIN=$(aws cloudfront get-distribution --id "$CF_DIST_ID" \
    --query "Distribution.DomainName" --output text 2>/dev/null || echo "")
  if [ -n "$CF_DOMAIN" ]; then
    CF_URL="https://$CF_DOMAIN"
  fi
fi

echo "  API Gateway:  $API_URL"
echo "  CloudFront:   ${CF_URL:-not available}"
echo ""

# On AWS, all services are behind a single API Gateway — no separate subdomains
# Map the old CF multi-subdomain URLs to the single API GW endpoint
export BASE_URL="${CF_URL:-$API_URL}"
export ORCHESTRATOR_URL="$API_URL"
export COMPLIANCE_URL="$API_URL"

mkdir -p results

if [ "$TEST" = "all" ]; then
  for script in tests/k6/*.js; do
    NAME=$(basename "$script" .js)
    echo "--- Running $NAME ---"
    k6 run "$script" --out json="results/k6-${NAME}-${ENV}.json" 2>&1 || true
    echo ""
  done
else
  SCRIPT="tests/k6/${TEST}.js"
  if [ ! -f "$SCRIPT" ]; then
    echo "ERROR: Test script not found: $SCRIPT"
    echo "Available: $(ls tests/k6/*.js 2>/dev/null | xargs -I{} basename {} .js | tr '\n' ' ')"
    exit 1
  fi
  k6 run "$SCRIPT" --out json="results/k6-${TEST}-${ENV}.json" 2>&1
fi

echo ""
echo "==> Results in results/"
