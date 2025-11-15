#!/bin/bash
# OPA (Open Policy Agent) test runner for AtlasIT

set -e

POLICIES_DIR="${POLICIES_DIR:-policies}"
TESTS_DIR="${TESTS_DIR:-policies/tests}"

echo "🔍 Running OPA policy tests..."

# Check if OPA is installed
if ! command -v opa &> /dev/null; then
  echo "❌ OPA not found. Installing OPA..."
  
  # Install OPA (Linux AMD64)
  OPA_VERSION="v0.59.0"
  curl -L -o opa "https://openpolicyagent.org/downloads/${OPA_VERSION}/opa_linux_amd64_static"
  chmod +x opa
  sudo mv opa /usr/local/bin/
  
  echo "✅ OPA installed"
fi

# Verify OPA version
opa version

# Check if policies directory exists
if [ ! -d "$POLICIES_DIR" ]; then
  echo "⚠️  No policies directory found at $POLICIES_DIR"
  echo "Skipping OPA tests"
  exit 0
fi

# Run OPA tests
echo ""
echo "📋 Testing policies in $POLICIES_DIR"

if [ -d "$TESTS_DIR" ]; then
  echo "Running test suite from $TESTS_DIR"
  opa test "$POLICIES_DIR" -v
else
  echo "⚠️  No tests directory found at $TESTS_DIR"
  echo "Validating policy syntax only"
  opa check "$POLICIES_DIR"
fi

echo ""
echo "✅ OPA policy tests completed"
