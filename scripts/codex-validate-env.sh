#!/usr/bin/env bash
# Codex Environment Validation Script
# Validates the Codex runtime environment and emits validation evidence
set -euo pipefail

echo "=== CODEX ENVIRONMENT VALIDATION START ==="
date -Iseconds

# Check Node.js version
echo ""
echo "--- Node.js Environment ---"
node --version || echo "ERROR: Node.js not found"
npm --version || echo "ERROR: npm not found"

# Check critical directories exist
echo ""
echo "--- Directory Structure ---"
for dir in scripts artifacts ops .github/workflows; do
  if [ -d "$dir" ]; then
    echo "✓ $dir exists"
  else
    echo "✗ $dir MISSING"
    exit 1
  fi
done

# Check package integrity
echo ""
echo "--- Package Validation ---"
if [ -f "package.json" ]; then
  echo "✓ package.json exists"
  node -e "const pkg = require('./package.json'); console.log('  Package:', pkg.name, 'v' + pkg.version);"
else
  echo "✗ package.json MISSING"
  exit 1
fi

if [ -f "package-lock.json" ]; then
  echo "✓ package-lock.json exists"
else
  echo "✗ package-lock.json MISSING"
  exit 1
fi

# Validate critical scripts exist
echo ""
echo "--- Critical Scripts ---"
for script in scripts/validate-env.mjs scripts/ci-run.mjs; do
  if [ -f "$script" ]; then
    echo "✓ $script exists"
  else
    echo "✗ $script MISSING"
    exit 1
  fi
done

# Check git repository health
echo ""
echo "--- Git Repository ---"
if [ -d ".git" ]; then
  echo "✓ Git repository initialized"
  git --no-pager log --oneline -1 || echo "WARNING: Cannot read git log"
  echo "  Current branch: $(git branch --show-current)"
else
  echo "✗ Git repository not found"
  exit 1
fi

# Check GitHub Actions workflows
echo ""
echo "--- GitHub Actions Workflows ---"
workflow_count=$(find .github/workflows -name "*.yml" -type f | wc -l)
echo "✓ Found $workflow_count workflow files"

echo ""
echo "=== CODEX ENVIRONMENT VALIDATION COMPLETE ==="
echo "Status: PASSED"
date -Iseconds
