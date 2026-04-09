#!/usr/bin/env bash
set -euo pipefail

# Export all Cloudflare configuration and data for migration
# Usage: ./scripts/cloudflare-export.sh
# Requires: wrangler CLI, curl, jq
# Env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID (or set below)

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-620865722bd88ef0a77dbbb60c91392e}"
ZONE_NAME="atlasit.pro"
EXPORT_DIR="exports/cloudflare-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$EXPORT_DIR"/{dns,kv,d1,r2,waf,config}
echo "==> Exporting Cloudflare config to $EXPORT_DIR"

# --- DNS Zone Export ---
echo ""
echo "--- DNS Records ---"
ZONE_ID=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" | jq -r '.result[0].id')

if [ "$ZONE_ID" != "null" ] && [ -n "$ZONE_ID" ]; then
  curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/export" \
    > "$EXPORT_DIR/dns/zone-export.txt"
  echo "    Exported DNS zone to dns/zone-export.txt"

  # Also get JSON for programmatic use
  curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?per_page=100" \
    | jq '.result' > "$EXPORT_DIR/dns/records.json"
  RECORD_COUNT=$(jq length "$EXPORT_DIR/dns/records.json")
  echo "    $RECORD_COUNT DNS records exported"
else
  echo "    WARNING: Could not find zone $ZONE_NAME"
fi

# --- WAF / Firewall Rules ---
echo ""
echo "--- WAF Rules ---"
if [ -n "$ZONE_ID" ] && [ "$ZONE_ID" != "null" ]; then
  curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/firewall/rules" \
    | jq '.result // []' > "$EXPORT_DIR/waf/firewall-rules.json"

  curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
    | jq '.result // []' > "$EXPORT_DIR/waf/rulesets.json"

  echo "    Exported firewall rules and rulesets"
fi

# --- Page Rules ---
echo ""
echo "--- Page Rules ---"
if [ -n "$ZONE_ID" ] && [ "$ZONE_ID" != "null" ]; then
  curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
    | jq '.result // []' > "$EXPORT_DIR/config/page-rules.json"
  echo "    Exported page rules"
fi

# --- KV Namespace Export ---
echo ""
echo "--- KV Namespaces ---"

declare -A KV_NAMESPACES=(
  ["KV_SESSIONS"]="c3017a1a156a4f2fa2da62dadc714c44"
  ["KV_CACHE"]="4f08086308004796bfd7cab01c34b006"
  ["KV_FEATURE_FLAGS"]="6a94dc4144f04b82a4989677c47509da"
  ["MCP_STORE"]="c7eba0c892bf4f2fbcf73fb60a38706c"
  ["TASKS"]="fa174a1795c94a48b47c22d6a138de29"
  ["IDEMPOTENCY_CACHE"]="51f84cb9b5624496b062d46b4019d7c7"
  ["DOCS"]="88514b613c2e4721a358352752580d65"
  ["STATE"]="c82d9a34f76d432aa4a141c1bec04e6d"
  ["API_TOKENS"]="3c5284c47e2e43dc8166fd53f2d35166"
)

for NAME in "${!KV_NAMESPACES[@]}"; do
  NS_ID="${KV_NAMESPACES[$NAME]}"
  echo "    Exporting $NAME ($NS_ID)..."
  mkdir -p "$EXPORT_DIR/kv/$NAME"

  npx wrangler kv key list --namespace-id "$NS_ID" 2>/dev/null \
    > "$EXPORT_DIR/kv/$NAME/keys.json" || echo "[]" > "$EXPORT_DIR/kv/$NAME/keys.json"

  KEY_COUNT=$(jq length "$EXPORT_DIR/kv/$NAME/keys.json" 2>/dev/null || echo 0)
  echo "      $KEY_COUNT keys"
done

# --- D1 Database Export ---
echo ""
echo "--- D1 Databases ---"

declare -A D1_DATABASES=(
  ["atlasit-shared"]="4c219864-76be-4453-a494-a4e0904e9cbc"
  ["atlas_core_db"]="4fb2e312-3ba5-4fa2-a91f-7275c71bea64"
  ["atlasit_compliance"]="25c2d388-8a76-4b8c-a594-21973239f0d5"
  ["atlas_audit_db"]="faa2caf5-0219-4507-9d8f-9ddab544615c"
  ["atlas_audit_shadow"]="d72ddfd9-c892-42ec-a5c3-b920788485c1"
)

for DB_NAME in "${!D1_DATABASES[@]}"; do
  echo "    Exporting $DB_NAME..."
  mkdir -p "$EXPORT_DIR/d1/$DB_NAME"

  # Schema
  npx wrangler d1 execute "$DB_NAME" --remote --command ".schema" \
    > "$EXPORT_DIR/d1/$DB_NAME/schema.sql" 2>/dev/null || true

  # Full dump
  npx wrangler d1 export "$DB_NAME" --remote \
    --output "$EXPORT_DIR/d1/$DB_NAME/dump.sql" 2>/dev/null || true

  # Row counts per table
  npx wrangler d1 execute "$DB_NAME" --remote \
    --command "SELECT name FROM sqlite_master WHERE type='table'" --json 2>/dev/null \
    | jq -r '.[].results[].name' 2>/dev/null | while read -r TABLE; do
      COUNT=$(npx wrangler d1 execute "$DB_NAME" --remote \
        --command "SELECT COUNT(*) as cnt FROM $TABLE" --json 2>/dev/null \
        | jq -r '.[].results[0].cnt' 2>/dev/null || echo "?")
      echo "      $TABLE: $COUNT rows"
    done
done

# --- R2 Bucket Inventory ---
echo ""
echo "--- R2 Buckets ---"

for BUCKET in atlas-evidence atlas-policies atlas-artifacts; do
  echo "    $BUCKET:"
  npx wrangler r2 object list "$BUCKET" --json 2>/dev/null \
    | jq 'length' > "$EXPORT_DIR/r2/${BUCKET}-count.txt" 2>/dev/null || echo "?" > "$EXPORT_DIR/r2/${BUCKET}-count.txt"
  echo "      $(cat "$EXPORT_DIR/r2/${BUCKET}-count.txt") objects"
done

# --- Worker List ---
echo ""
echo "--- Deployed Workers ---"
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts" \
  | jq '[.result[] | {id, created_on, modified_on}]' > "$EXPORT_DIR/config/workers.json"
WORKER_COUNT=$(jq length "$EXPORT_DIR/config/workers.json")
echo "    $WORKER_COUNT workers deployed"

# --- Summary ---
echo ""
echo "==> Export complete: $EXPORT_DIR"
echo "    DNS records, WAF rules, page rules, KV namespaces, D1 databases, R2 inventory, worker list"
du -sh "$EXPORT_DIR" 2>/dev/null || true
