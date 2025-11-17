#!/bin/bash

set -euo pipefail

# 🧠 Codex Delegation Policy Loader
# Enforces policy based on codex_delegation_policy.json during CI workflows

POLICY_FILE="codex_delegation_policy.json"
TRACE_ID=$(uuidgen)

if [[ ! -f "$POLICY_FILE" ]]; then
  echo "❌ Policy file not found: $POLICY_FILE"
  exit 78
fi

# Extract delegation rules
RULES=$(jq -c '.delegation_rules[]' "$POLICY_FILE")

echo "📘 Loaded Codex Delegation Policy"
echo "Trace ID: $TRACE_ID"

# Iterate over rules and enforce label presence if required
for rule in $RULES; do
  TASK=$(echo "$rule" | jq -r '.task')
  LABEL=$(echo "$rule" | jq -r '.requires_label')
  LIMIT=$(echo "$rule" | jq -r '.limit_per_run')
  ID=$(echo "$rule" | jq -r '.id')

  echo "🔍 Checking task policy: [$ID] $TASK"

  if [[ -n "$LABEL" ]]; then
    echo " - Requires label: $LABEL"
    if ! grep -q "$LABEL" <<< "$CI_PR_LABELS"; then
      echo " ⚠️  Skipping task '$ID' — label '$LABEL' not present in CI_PR_LABELS"
      continue
    fi
  fi

  echo " ✅ Task '$ID' is cleared to execute (limit: $LIMIT)"
done

# Emit evidence
mkdir -p evidence
cat <<EOF > evidence/EV-policy-check-$TRACE_ID.json
{
  "trace_id": "$TRACE_ID",
  "status": "policy_evaluated",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "source": "load_codex_policy.sh",
  "rules_checked": $(jq '.delegation_rules' "$POLICY_FILE")
}
EOF

echo "📤 Emitted: evidence/EV-policy-check-$TRACE_ID.json"
echo "✅ Codex delegation policy enforcement complete"
exit 0