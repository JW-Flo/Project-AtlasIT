#!/usr/bin/env bash
set -e

# AtlasIT Environment Setup Script
# Initializes the AtlasIT environment with necessary dependencies and configuration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

NON_INTERACTIVE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --non-interactive)
      NON_INTERACTIVE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "=== AtlasIT Environment Setup ==="
echo "Project root: $PROJECT_ROOT"

# Set environment variables for Codex
export NODE_ENV=development
export CI=true
export WRANGLER_NON_INTERACTIVE=true

echo "Environment variables set:"
echo "  NODE_ENV=$NODE_ENV"
echo "  CI=$CI"
echo "  WRANGLER_NON_INTERACTIVE=$WRANGLER_NON_INTERACTIVE"

# Verify Node.js version
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo "Node.js version: $NODE_VERSION"
else
  echo "Error: Node.js is not installed"
  exit 1
fi

# Verify npm is available
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo "npm version: $NPM_VERSION"
else
  echo "Error: npm is not installed"
  exit 1
fi

# Check if Python is available
if command -v python3 &> /dev/null; then
  PYTHON_VERSION=$(python3 --version)
  echo "Python version: $PYTHON_VERSION"
else
  echo "Warning: Python 3 is not installed (optional dependency)"
fi

# Validate .codex/env.json exists
if [ -f "$PROJECT_ROOT/.codex/env.json" ]; then
  echo "✓ Codex environment configuration found"
else
  echo "Warning: .codex/env.json not found"
fi

# Install dependencies if not in CI or if interactive
if [ "$NON_INTERACTIVE" = false ] && [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "Installing dependencies..."
  cd "$PROJECT_ROOT"
  npm install
elif [ "$NON_INTERACTIVE" = true ]; then
  echo "Skipping dependency installation (non-interactive mode)"
fi

echo "=== AtlasIT Environment Setup Complete ==="
