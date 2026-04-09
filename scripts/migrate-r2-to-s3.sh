#!/usr/bin/env bash
set -euo pipefail

# Migrate R2 buckets to S3 using rclone
# Usage: ./scripts/migrate-r2-to-s3.sh <env>
# Requires: rclone configured with r2 remote and s3 credentials

ENV="${1:-dev}"
ACCOUNT_ID="457335975503"

declare -A BUCKET_MAP=(
  ["atlas-evidence"]="atlasit-evidence-${ENV}-${ACCOUNT_ID}"
  ["atlas-policies"]="atlasit-policies-${ENV}-${ACCOUNT_ID}"
  ["atlas-artifacts"]="atlasit-artifacts-${ENV}-${ACCOUNT_ID}"
)

echo "==> R2 → S3 migration (env: $ENV)"

for R2_BUCKET in "${!BUCKET_MAP[@]}"; do
  S3_BUCKET="${BUCKET_MAP[$R2_BUCKET]}"
  echo ""
  echo "--- $R2_BUCKET → s3://$S3_BUCKET ---"

  # Count source objects
  SRC_COUNT=$(rclone size "r2:$R2_BUCKET" --json 2>/dev/null | jq '.count // 0')
  echo "    Source objects: $SRC_COUNT"

  # Sync with checksum verification
  rclone sync "r2:$R2_BUCKET" "s3:$S3_BUCKET" \
    --transfers 16 \
    --checkers 8 \
    --progress \
    --checksum \
    --log-level INFO

  # Verify
  echo "    Verifying..."
  rclone check "r2:$R2_BUCKET" "s3:$S3_BUCKET" --one-way 2>&1 | tail -3

  DST_COUNT=$(rclone size "s3:$S3_BUCKET" --json 2>/dev/null | jq '.count // 0')
  echo "    Destination objects: $DST_COUNT"

  if [ "$SRC_COUNT" -eq "$DST_COUNT" ]; then
    echo "    ✓ Object count matches"
  else
    echo "    ✗ Count mismatch! Source=$SRC_COUNT Dest=$DST_COUNT"
    exit 1
  fi
done

echo ""
echo "==> R2 → S3 migration complete"
