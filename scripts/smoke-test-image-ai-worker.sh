#!/usr/bin/env bash
set -euo pipefail

: "${WORKER_URL?Need to set WORKER_URL}"

IMG_PATH="/tmp/test-image.png"
echo "[INFO] Generating test image..."
convert -size 32x32 xc:blue "$IMG_PATH"

echo "[INFO] Uploading image to $WORKER_URL/images/upload..."
UPLOAD_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$WORKER_URL/images/upload" \
  -F "image=@$IMG_PATH;type=image/png")
ID=$(echo "$UPLOAD_RESPONSE" | head -n1 | jq -r .id)
UPLOAD_CODE=$(echo "$UPLOAD_RESPONSE" | tail -n1)

echo "[INFO] /images/upload returned HTTP $UPLOAD_CODE, id: $ID"
if [[ "$UPLOAD_CODE" != "201" || -z "$ID" ]]; then
  echo "[ERROR] /images/upload failed."
  exit 1
fi

echo "[INFO] Triggering analysis for image $ID..."
ANALYZE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_URL/images/$ID/analyze")
echo "[INFO] /images/$ID/analyze returned HTTP $ANALYZE_CODE"
if [[ "$ANALYZE_CODE" != "200" ]]; then
  echo "[ERROR] /images/$ID/analyze failed."
  exit 1
fi

echo "[INFO] Fetching metadata and analysis results..."
GET_RESPONSE=$(curl -s -w '\n%{http_code}' "$WORKER_URL/images/$ID")
GET_CODE=$(echo "$GET_RESPONSE" | tail -n1)
META=$(echo "$GET_RESPONSE" | head -n1)
echo "[INFO] /images/$ID returned HTTP $GET_CODE"
if [[ "$GET_CODE" != "200" ]]; then
  echo "[ERROR] /images/$ID fetch failed."
  exit 1
fi
echo "[INFO] Metadata and analysis: $META"
echo "✅ Image AI Worker smoke test passed." 