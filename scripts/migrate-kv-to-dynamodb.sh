#!/usr/bin/env bash
set -euo pipefail

# Migrate Cloudflare KV namespaces to DynamoDB tables
# Usage: ./scripts/migrate-kv-to-dynamodb.sh <env>
# Requires: wrangler CLI, aws CLI, jq

ENV="${1:-dev}"
ACCOUNT_ID="620865722bd88ef0a77dbbb60c91392e"

declare -A KV_MAP=(
  ["c3017a1a156a4f2fa2da62dadc714c44"]="atlasit-sessions-${ENV}"
  ["4f08086308004796bfd7cab01c34b006"]="atlasit-cache-${ENV}"
  ["6a94dc4144f04b82a4989677c47509da"]="atlasit-feature-flags-${ENV}"
  ["c7eba0c892bf4f2fbcf73fb60a38706c"]="atlasit-idem-${ENV}"
)

declare -A KV_PREFIX=(
  ["c3017a1a156a4f2fa2da62dadc714c44"]="session#"
  ["4f08086308004796bfd7cab01c34b006"]="cache#"
  ["6a94dc4144f04b82a4989677c47509da"]="flag#"
  ["c7eba0c892bf4f2fbcf73fb60a38706c"]="mcp#"
)

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

for NS_ID in "${!KV_MAP[@]}"; do
  TABLE="${KV_MAP[$NS_ID]}"
  PREFIX="${KV_PREFIX[$NS_ID]}"
  echo "==> Migrating KV namespace $NS_ID → DynamoDB table $TABLE"

  # List all keys
  npx wrangler kv key list --namespace-id "$NS_ID" > "$TMPDIR/keys.json"
  KEY_COUNT=$(jq length "$TMPDIR/keys.json")
  echo "    Found $KEY_COUNT keys"

  # Export each key and write to DynamoDB
  BATCH_FILE="$TMPDIR/batch.json"
  BATCH_COUNT=0

  echo '{"'"$TABLE"'": []}' > "$BATCH_FILE"

  jq -r '.[].name' "$TMPDIR/keys.json" | while read -r KEY; do
    VALUE=$(npx wrangler kv key get "$KEY" --namespace-id "$NS_ID" 2>/dev/null || echo "")
    if [ -z "$VALUE" ]; then continue; fi

    # Build DynamoDB put request
    ITEM=$(jq -n \
      --arg pk "${PREFIX}${KEY}" \
      --arg val "$VALUE" \
      '{PutRequest: {Item: {pk: {S: $pk}, value: {S: $val}}}}')

    # Append to batch (max 25 per batch-write-item)
    jq --arg table "$TABLE" --argjson item "$ITEM" \
      '.[$table] += [$item]' "$BATCH_FILE" > "$TMPDIR/tmp.json" && mv "$TMPDIR/tmp.json" "$BATCH_FILE"

    BATCH_COUNT=$((BATCH_COUNT + 1))

    if [ "$BATCH_COUNT" -ge 25 ]; then
      aws dynamodb batch-write-item --request-items "file://$BATCH_FILE"
      echo '{"'"$TABLE"'": []}' > "$BATCH_FILE"
      BATCH_COUNT=0
    fi
  done

  # Flush remaining
  REMAINING=$(jq --arg t "$TABLE" '.[$t] | length' "$BATCH_FILE")
  if [ "$REMAINING" -gt 0 ]; then
    aws dynamodb batch-write-item --request-items "file://$BATCH_FILE"
  fi

  echo "    Done: $KEY_COUNT keys migrated to $TABLE"
done

echo "==> KV migration complete"
