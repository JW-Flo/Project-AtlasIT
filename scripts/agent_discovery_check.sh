#!/bin/bash

set -euo pipefail

# Agent Discovery & Task Planner
# Finds .agent.md declarations and queues Codex/Copilot sync

echo "🔍 Scanning for GitHub Copilot agents..."
AGENT_FILES=$(find .github/agents -name '*.agent.md' || true)

if [[ -z "$AGENT_FILES" ]]; then
  echo "⚠️  No agent definitions found in .github/agents"
  exit 0
fi

echo "🧠 Found agents:"
echo "$AGENT_FILES"
echo

TASK_LIST="codex-tasks/AGENT-TASKS-$(date +%Y%m%d%H%M).txt"
mkdir -p codex-tasks

for file in $AGENT_FILES; do
  AGENT_NAME=$(basename "$file" .agent.md)
  echo "- [ ] Review agent: $AGENT_NAME   (source: $file)" >> "$TASK_LIST"
  echo "    - Codex: validate logic & emissions" >> "$TASK_LIST"
  echo "    - Copilot: confirm descriptive plan + PR readiness" >> "$TASK_LIST"
  echo "    - Ensure evidence emitted under /evidence/$AGENT_NAME-*.json" >> "$TASK_LIST"
done

echo "✅ Agent task list written to: $TASK_LIST"
cat "$TASK_LIST"

exit 0