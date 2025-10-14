#!/bin/bash
# Post-deployment smoke tests for AtlasIT workers
# Usage: ./scripts/post-deploy-smoke.sh [environment]
# Environment: dev|staging|production (default: dev)

set -e

ENVIRONMENT=${1:-dev}
EXIT_CODE=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "AtlasIT Post-Deployment Smoke Tests"
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=================================================="
echo ""

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local method=${4:-GET}
    local headers=${5:-}
    local body=${6:-}
    
    echo -n "Testing $name... "
    
    # Build curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    # Add headers if provided
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    # Add body if provided
    if [ -n "$body" ]; then
        curl_cmd="$curl_cmd -d '$body' -H 'Content-Type: application/json'"
    fi
    
    curl_cmd="$curl_cmd $url"
    
    # Execute curl and capture response
    local response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | sed '$d')
    
    # Check status code
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $http_code)"
        echo "  Response: $response_body"
        EXIT_CODE=1
        return 1
    fi
}

# Function to test endpoint with JSON validation
test_endpoint_json() {
    local name=$1
    local url=$2
    local required_fields=$3
    local method=${4:-GET}
    local headers=${5:-}
    
    echo -n "Testing $name... "
    
    # Build curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    curl_cmd="$curl_cmd $url"
    
    # Execute curl
    local response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | sed '$d')
    
    # Check status code
    if [ "$http_code" != "200" ]; then
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        EXIT_CODE=1
        return 1
    fi
    
    # Validate JSON and required fields
    if ! echo "$response_body" | jq empty 2>/dev/null; then
        echo -e "${RED}✗ FAIL${NC} (Invalid JSON)"
        EXIT_CODE=1
        return 1
    fi
    
    # Check required fields
    local missing_fields=""
    for field in $required_fields; do
        if ! echo "$response_body" | jq -e ".$field" >/dev/null 2>&1; then
            missing_fields="$missing_fields $field"
        fi
    done
    
    if [ -n "$missing_fields" ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (Missing fields:$missing_fields)"
        return 0
    fi
    
    echo -e "${GREEN}✓ PASS${NC}"
    return 0
}

# Load environment-specific configuration
case $ENVIRONMENT in
    dev)
        ONBOARDING_URL="${ONBOARDING_URL:-http://localhost:8787}"
        ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-http://localhost:8788}"
        DOCS_URL="${DOCS_URL:-http://localhost:8789}"
        COMPLIANCE_URL="${COMPLIANCE_URL:-http://localhost:8790}"
        CONSOLE_URL="${CONSOLE_URL:-http://localhost:5173}"
        API_KEY="${ONBOARDING_API_KEY:-}"
        ;;
    staging)
        ONBOARDING_URL="${ONBOARDING_URL:-https://onboarding-staging.atlasit.workers.dev}"
        ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-https://orchestrator-staging.atlasit.workers.dev}"
        DOCS_URL="${DOCS_URL:-https://docs-staging.atlasit.workers.dev}"
        COMPLIANCE_URL="${COMPLIANCE_URL:-https://compliance-staging.atlasit.workers.dev}"
        CONSOLE_URL="${CONSOLE_URL:-https://console-staging.atlasit.pages.dev}"
        API_KEY="${ONBOARDING_API_KEY:?ONBOARDING_API_KEY required for staging}"
        ;;
    production)
        ONBOARDING_URL="${ONBOARDING_URL:-https://onboarding.atlasit.workers.dev}"
        ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-https://orchestrator.atlasit.workers.dev}"
        DOCS_URL="${DOCS_URL:-https://docs.atlasit.workers.dev}"
        COMPLIANCE_URL="${COMPLIANCE_URL:-https://compliance.atlasit.workers.dev}"
        CONSOLE_URL="${CONSOLE_URL:-https://console.atlasit.pages.dev}"
        API_KEY="${ONBOARDING_API_KEY:?ONBOARDING_API_KEY required for production}"
        ;;
    *)
        echo -e "${RED}ERROR: Invalid environment '$ENVIRONMENT'${NC}"
        echo "Valid environments: dev, staging, production"
        exit 1
        ;;
esac

# Prepare headers
if [ -n "$API_KEY" ]; then
    AUTH_HEADER="-H 'x-api-key: $API_KEY'"
else
    AUTH_HEADER=""
fi

echo "Configuration:"
echo "  Onboarding: $ONBOARDING_URL"
echo "  Orchestrator: $ORCHESTRATOR_URL"
echo "  Compliance: $COMPLIANCE_URL"
echo "  Console: $CONSOLE_URL"
echo "  Auth: $([ -n "$API_KEY" ] && echo "Enabled" || echo "Disabled")"
echo ""

# ============================================================
# Test Suite: Health Endpoints
# ============================================================
echo "Test Suite: Health Endpoints"
echo "----------------------------"

test_endpoint "Onboarding health" "$ONBOARDING_URL/health" 200
test_endpoint "Onboarding healthz" "$ONBOARDING_URL/healthz" 200
test_endpoint "Orchestrator health" "$ORCHESTRATOR_URL/health" 200
test_endpoint "Orchestrator healthz" "$ORCHESTRATOR_URL/healthz" 200
test_endpoint "Compliance health" "$COMPLIANCE_URL/health" 200

echo ""

# ============================================================
# Test Suite: Health Endpoint Content
# ============================================================
echo "Test Suite: Health Endpoint JSON Structure"
echo "------------------------------------------"

test_endpoint_json "Onboarding health JSON" "$ONBOARDING_URL/health" "status timestamp"
test_endpoint_json "Orchestrator health JSON" "$ORCHESTRATOR_URL/health" "status timestamp quota"
test_endpoint_json "Compliance health JSON" "$COMPLIANCE_URL/health" "status timestamp"

echo ""

# ============================================================
# Test Suite: Core API Endpoints (Read-only)
# ============================================================
echo "Test Suite: Core API Endpoints"
echo "------------------------------"

# Compliance endpoints
test_endpoint_json "Compliance snapshot" "$COMPLIANCE_URL/api/compliance/snapshot" "tenantId frameworkSummary risks policies"
test_endpoint_json "Evidence search" "$COMPLIANCE_URL/api/evidence/search?tenantId=demo&limit=5" "items"
test_endpoint "Policy templates" "$COMPLIANCE_URL/api/v1/policies/templates" 200
test_endpoint "Policy coverage" "$COMPLIANCE_URL/api/v1/policies/coverage" 200
test_endpoint "Activity log" "$COMPLIANCE_URL/api/v1/activity" 200

# Orchestrator endpoints (require auth in non-dev)
if [ "$ENVIRONMENT" = "dev" ] || [ -n "$API_KEY" ]; then
    test_endpoint "Orchestrator status" "$ORCHESTRATOR_URL/status" 200 "GET" "$AUTH_HEADER"
    test_endpoint "Orchestrator integrations" "$ORCHESTRATOR_URL/integrations" 200 "GET" "$AUTH_HEADER"
fi

echo ""

# ============================================================
# Test Suite: Console App (UI)
# ============================================================
echo "Test Suite: Console Application"
echo "-------------------------------"

# Only test console if URL is accessible
if curl -s --connect-timeout 5 "$CONSOLE_URL" >/dev/null 2>&1; then
    test_endpoint "Console landing page" "$CONSOLE_URL/" 200
    test_endpoint "Console dashboard" "$CONSOLE_URL/console" 200
    test_endpoint "Console config API" "$CONSOLE_URL/api/config" 200
else
    echo -e "${YELLOW}⚠ SKIP${NC} Console not accessible (likely not deployed)"
fi

echo ""

# ============================================================
# Test Suite: Negative Tests (Error Handling)
# ============================================================
echo "Test Suite: Error Handling"
echo "-------------------------"

test_endpoint "Non-existent endpoint (404)" "$ONBOARDING_URL/api/nonexistent" 404
test_endpoint "Invalid evidence query" "$COMPLIANCE_URL/api/evidence/nonexistent-id" 404

# Test authentication if API key is configured
if [ -n "$API_KEY" ]; then
    test_endpoint "Unauthorized access" "$ORCHESTRATOR_URL/status" 401 "GET" ""
fi

echo ""

# ============================================================
# Summary
# ============================================================
echo "=================================================="
echo "Smoke Test Summary"
echo "=================================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo "Deployment smoke tests completed successfully"
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please review failures above"
fi

echo "=================================================="

exit $EXIT_CODE
