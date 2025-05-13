#!/usr/bin/env bash
set -euo pipefail

# Script to rename the sandbox pipeline workflow and push sandbox branches.
# Usage: ./fix_sandbox.sh

# Abort any in-progress merge
if git rev-parse -q --verify MERGE_HEAD >/dev/null; then
  git merge --abort
fi

# Clean reset
git reset --hard HEAD

# Checkout or create sandbox-workflows based on main
git fetch origin main
if git rev-parse --verify sandbox-workflows >/dev/null 2>&1; then
  git checkout sandbox-workflows
else
  git checkout -b sandbox-workflows origin/main
fi

# Rename the workflow file
WORKFLOW_DIR=".github/workflows"
mkdir -p "$WORKFLOW_DIR"
if [[ -f "$WORKFLOW_DIR/autonomous_pipeline.yml" ]]; then
  git mv "$WORKFLOW_DIR/autonomous_pipeline.yml" "$WORKFLOW_DIR/sandbox-pipeline.yml"
elif [[ -f "$WORKFLOW_DIR/Pipeline (Sandbox Test).yml" ]]; then
  git mv "$WORKFLOW_DIR/Pipeline (Sandbox Test).yml" "$WORKFLOW_DIR/sandbox-pipeline.yml"
else
  echo "❌ Workflow file not found in $WORKFLOW_DIR"
  exit 1
fi

# Commit and push sandbox-workflows
git add "$WORKFLOW_DIR/sandbox-pipeline.yml"
git commit -m "chore: rename sandbox pipeline"
git push -u origin sandbox-workflows

# Create and push sandbox-o3 and sandbox-4o branches
for BR in sandbox-o3 sandbox-4o; do
  git checkout sandbox-workflows
  git branch -D "$BR" 2>/dev/null || true
  git checkout -b "$BR"
  git push -u origin "$BR"
done

 echo "✅ Sandbox branches created and pipeline deployed!"