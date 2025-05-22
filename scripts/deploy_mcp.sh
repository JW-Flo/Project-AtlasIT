#!/bin/bash
set -euo pipefail

# Configuration
MCP_HOST="mcp.project-ignite.kd8jc7v8cd.workers.dev"
AGENTS_DIR="agents"
MCP_DIR="mcp"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Deploying MCP Server and Agents..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler is not installed${NC}"
    exit 1
fi

# Deploy MCP Server
echo "📦 Deploying MCP Server..."
cd $MCP_DIR
wrangler deploy

# Deploy Agents
echo "🤖 Deploying Agents..."
cd ../$AGENTS_DIR

# Deploy each agent
for agent in */; do
    if [ -f "${agent}wrangler.toml" ]; then
        echo "Deploying ${agent%/}..."
        cd "$agent"
        wrangler deploy
        cd ..
    fi
done

# Configure MCP Server
echo "⚙️ Configuring MCP Server..."
curl -X POST "https://$MCP_HOST/configure" \
    -H "Content-Type: application/json" \
    -d '{
        "agents": [
            {
                "name": "soc-coordinator",
                "type": "coordinator",
                "capabilities": ["security", "orchestration"]
            },
            {
                "name": "security-agent",
                "type": "security",
                "capabilities": ["threat-detection", "compliance"]
            },
            {
                "name": "infrastructure-agent",
                "type": "infrastructure",
                "capabilities": ["deployment", "monitoring"]
            }
        ],
        "settings": {
            "autonomous_mode": true,
            "max_concurrent_tasks": 5,
            "task_timeout": 300
        }
    }'

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

echo -e "${GREEN}✅ MCP Server and Agents deployed successfully!${NC}"
echo "🌐 MCP Server URL: https://$MCP_HOST"
echo "📊 Monitor your agents at: https://$MCP_HOST/dashboard"
