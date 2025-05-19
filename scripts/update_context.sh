#!/usr/bin/env bash
set -euo pipefail

# Paths
CTX_DIR="$(pwd)/context"
ITERM_CTX="$CTX_DIR/.iterm2-context.txt"
AGENT_CTX="$CTX_DIR/.ai-agent-context.txt"

# Ensure context folder exists
mkdir -p "$CTX_DIR"

# Capture git status
echo "===== Git Status =====" > "$ITERM_CTX"
git status --short >> "$ITERM_CTX"

# Capture directory tree
echo -e "\n===== Project Tree =====" >> "$ITERM_CTX"
ls -R . >> "$ITERM_CTX"

# Capture recent shell history
echo -e "\n===== Recent Shell History =====" >> "$ITERM_CTX"
history | tail -n 50 >> "$ITERM_CTX"

# Mirror for AI agent
cp "$ITERM_CTX" "$AGENT_CTX"

echo "✅ Context updated:"
echo "   • $ITERM_CTX"
echo "   • $AGENT_CTX"
