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

# Revert the repository to the desired state
echo "🔄 Reverting repository to the desired state..."
git revert --no-commit HEAD
git commit -m "Revert to the desired state"

# Verify the revert by checking out the commit and reviewing the changes
echo "🔍 Verifying the revert..."
git checkout HEAD
git log -1

# Commit and push the changes to the repository
echo "📤 Committing and pushing the changes..."
git push origin main
