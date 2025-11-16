#!/bin/bash
# run-opa.sh
# Executes OPA policy tests against provided input

set -e

POLICIES_DIR="${POLICIES_DIR:-./policies}"
INPUT_FILE="${1:-}"

if [ -z "$INPUT_FILE" ]; then
  echo "Usage: run-opa.sh <input.json>"
  exit 1
fi

# Check for required dependencies
if ! command -v jq &> /dev/null; then
  echo "[OPA] jq not installed, attempting to install..."
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y jq
  elif command -v brew &> /dev/null; then
    brew install jq
  else
    echo "[OPA] Error: jq is required but not installed. Please install jq manually."
    exit 1
  fi
fi

if ! command -v opa &> /dev/null; then
  echo "[OPA] OPA not installed, downloading..."
  mkdir -p /tmp/opa
  curl -L -o /tmp/opa/opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
  chmod +x /tmp/opa/opa
  export PATH="/tmp/opa:$PATH"
fi

echo "[OPA] Running policy tests..."
echo "[OPA] Policies: $POLICIES_DIR"
echo "[OPA] Input: $INPUT_FILE"

# Test all .rego files
for policy in "$POLICIES_DIR"/*.rego; do
  if [ -f "$policy" ]; then
    echo "[OPA] Testing policy: $policy"
    opa eval --data "$policy" --input "$INPUT_FILE" --format pretty "data"
  fi
done

# Check for deny rules
DENY_COUNT=$(opa eval --data "$POLICIES_DIR" --input "$INPUT_FILE" --format raw "data.atlasit.grammar.deny" 2>/dev/null | jq -r 'length // 0' || echo "0")

if [ "$DENY_COUNT" != "0" ]; then
  echo "[OPA] Policy violations found: $DENY_COUNT"
  opa eval --data "$POLICIES_DIR" --input "$INPUT_FILE" --format pretty "data.atlasit.grammar.deny"
  exit 1
fi

echo "[OPA] All policies passed ✅"
exit 0
