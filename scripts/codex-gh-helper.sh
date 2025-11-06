#!/bin/bash
#
# Codex GitHub Helper
# 
# Provides helper functions for Codex agents to interact with GitHub via the AtlasIT proxy worker.
# Functions: codex_pull, codex_commit, codex_push
#
# Usage:
#   source scripts/codex-gh-helper.sh
#   codex_pull "path/to/file"
#   codex_commit "commit message" "path/to/file"
#   codex_push
#
# Environment Variables Required:
#   PROXY_ENDPOINT - URL of the GitHub proxy worker (e.g., https://atlasit-github-proxy.workers.dev)
#   PROXY_TOKEN - Authentication token for the proxy

set -e

# Default configuration
PROXY_ENDPOINT="${PROXY_ENDPOINT:-https://atlasit-github-proxy.workers.dev}"
PROXY_LOG="${PROXY_LOG:-ops/.codex_proxy.log}"
REPO_OWNER="HarderWorkingCo"
REPO_NAME="Project-AtlasIT"

# Ensure log directory exists
mkdir -p "$(dirname "$PROXY_LOG")"

# Log function
log_proxy() {
    local trace_id="$1"
    local action="$2"
    local status="$3"
    local details="$4"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "{\"timestamp\":\"$timestamp\",\"trace_id\":\"$trace_id\",\"action\":\"$action\",\"status\":\"$status\",\"details\":\"$details\"}" >> "$PROXY_LOG"
}

# Verify dependencies
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is required but not installed. Install with: apt-get install jq or brew install jq" >&2
        return 1
    fi
}

# Verify proxy token is set
check_proxy_token() {
    if [ -z "$PROXY_TOKEN" ]; then
        echo "Error: PROXY_TOKEN environment variable not set" >&2
        return 1
    fi
}

# Pull file contents from GitHub
codex_pull() {
    check_proxy_token || return 1
    
    local file_path="$1"
    local ref="${2:-main}"
    
    if [ -z "$file_path" ]; then
        echo "Usage: codex_pull <file_path> [ref]" >&2
        return 1
    fi
    
    local trace_id=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "no-uuid-$(date +%s)")
    local endpoint_path="/repos/$REPO_OWNER/$REPO_NAME/contents/$file_path"
    local url="$PROXY_ENDPOINT?path=${endpoint_path}&ref=${ref}"
    
    echo "Fetching: $file_path (ref: $ref)" >&2
    
    local response=$(curl -s -w "\n%{http_code}" \
        -H "X-Proxy-Token: $PROXY_TOKEN" \
        -H "Content-Type: application/json" \
        "$url")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        log_proxy "$trace_id" "codex_pull" "success" "path=$file_path,ref=$ref"
        echo "$body"
        return 0
    else
        log_proxy "$trace_id" "codex_pull" "error" "path=$file_path,ref=$ref,http_code=$http_code"
        echo "Error: HTTP $http_code - $body" >&2
        return 1
    fi
}

# Create or update file in GitHub
codex_commit() {
    check_proxy_token || return 1
    check_dependencies || return 1
    
    local message="$1"
    local file_path="$2"
    local content="$3"
    local branch="${4:-main}"
    
    if [ -z "$message" ] || [ -z "$file_path" ] || [ -z "$content" ]; then
        echo "Usage: codex_commit <message> <file_path> <content> [branch]" >&2
        return 1
    fi
    
    local trace_id=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "no-uuid-$(date +%s)")
    local endpoint_path="/repos/$REPO_OWNER/$REPO_NAME/contents/$file_path"
    local url="$PROXY_ENDPOINT?path=${endpoint_path}"
    
    # Base64 encode content
    local encoded_content=$(echo -n "$content" | base64 | tr -d '\n')
    
    # Get current file SHA (if exists)
    local sha=$(codex_pull "$file_path" "$branch" 2>/dev/null | jq -r '.sha // empty')
    
    # Build JSON payload
    local payload="{\"message\":\"$message\",\"content\":\"$encoded_content\",\"branch\":\"$branch\""
    if [ -n "$sha" ]; then
        payload="$payload,\"sha\":\"$sha\""
    fi
    payload="$payload}"
    
    echo "Committing: $file_path" >&2
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X PUT \
        -H "X-Proxy-Token: $PROXY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$url")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log_proxy "$trace_id" "codex_commit" "success" "path=$file_path,branch=$branch"
        echo "$body"
        return 0
    else
        log_proxy "$trace_id" "codex_commit" "error" "path=$file_path,branch=$branch,http_code=$http_code"
        echo "Error: HTTP $http_code - $body" >&2
        return 1
    fi
}

# Push local changes (placeholder - maps to git push via proxy)
codex_push() {
    check_proxy_token || return 1
    
    echo "codex_push: This is a placeholder for future git push proxy support" >&2
    echo "Currently, use codex_commit for individual file changes" >&2
    
    local trace_id=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "no-uuid-$(date +%s)")
    log_proxy "$trace_id" "codex_push" "info" "placeholder_called"
    
    return 0
}

# Test proxy connectivity
codex_test() {
    check_proxy_token || return 1
    
    echo "Testing proxy connection..." >&2
    
    local trace_id=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "no-uuid-$(date +%s)")
    local url="$PROXY_ENDPOINT/health"
    
    local response=$(curl -s -w "\n%{http_code}" \
        -H "X-Proxy-Token: $PROXY_TOKEN" \
        "$url")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        log_proxy "$trace_id" "codex_test" "success" "health_check"
        echo "✓ Proxy connection successful"
        echo "$body"
        return 0
    else
        log_proxy "$trace_id" "codex_test" "error" "health_check,http_code=$http_code"
        echo "✗ Proxy connection failed: HTTP $http_code" >&2
        echo "$body" >&2
        return 1
    fi
}

# Export functions
export -f codex_pull codex_commit codex_push codex_test

echo "Codex GitHub Helper loaded. Available functions: codex_pull, codex_commit, codex_push, codex_test"
