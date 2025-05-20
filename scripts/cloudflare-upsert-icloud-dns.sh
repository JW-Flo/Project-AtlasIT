#!/usr/bin/env bash
set -euo pipefail

: "${READ_ALL_SECRETS?Need to set READ_ALL_SECRETS}"  # Cloudflare API token
: "${CLOUDFLARE_ZONE_ID?Need to set CLOUDFLARE_ZONE_ID}"  # Cloudflare Zone ID

DOMAIN="andreysergeevich.me"

upsert_record() {
  local TYPE="$1" NAME="$2" CONTENT="$3" PRIORITY="${4:-}"
  echo "[INFO] Upserting $TYPE record for $NAME ($CONTENT)"
  RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?type=$TYPE&name=$NAME.$DOMAIN" \
    -H "Authorization: Bearer $READ_ALL_SECRETS" -H "Content-Type: application/json" | jq -r '.result[0].id // empty')
  DATA="{\"type\":\"$TYPE\",\"name\":\"$NAME\",\"content\":\"$CONTENT\""
  if [[ -n "$PRIORITY" ]]; then DATA="$DATA, \"priority\":$PRIORITY"; fi
  DATA="$DATA}"
  if [[ -n "$RECORD_ID" ]]; then
    curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $READ_ALL_SECRETS" -H "Content-Type: application/json" --data "$DATA" | jq .
  else
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
      -H "Authorization: Bearer $READ_ALL_SECRETS" -H "Content-Type: application/json" --data "$DATA" | jq .
  fi
}

echo "[INFO] Upserting iCloud Mail DNS records for $DOMAIN via Cloudflare API..."

# MX records
upsert_record MX "@" "mx01.mail.icloud.com." 10
upsert_record MX "@" "mx02.mail.icloud.com." 10

# TXT records
upsert_record TXT "@" "apple-domain=30xcBKmoB17udLuB"
upsert_record TXT "@" "v=spf1 include:icloud.com ~all"

# DKIM (CNAME)
upsert_record CNAME "sig1._domainkey" "sig1.dkim.andreysergeevich.me.at.icloudmailadmin.com."

echo "[SUCCESS] All records upserted for $DOMAIN." 