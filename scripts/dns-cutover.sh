#!/usr/bin/env bash
set -euo pipefail

# DNS Cutover: Cloudflare → AWS (Route 53 weighted routing)
# Usage: ./scripts/dns-cutover.sh <phase> [--dry-run]
#
# Phases:
#   pre-lower-ttl   — Lower TTL on all records to 60s (run 72h before cutover)
#   canary-1pct     — Route 1% to AWS, 99% to Cloudflare
#   canary-20pct    — Route 20% to AWS
#   split-50        — Route 50/50
#   aws-majority    — Route 99% to AWS
#   aws-full        — Route 100% to AWS, remove Cloudflare records
#   rollback        — Immediately route 100% back to Cloudflare
#   restore-ttl     — Restore TTL to 300s (run after stable cutover)
#
# Requires: aws CLI configured, CLOUDFLARE_API_TOKEN set

PHASE="${1:?Usage: $0 <phase> [--dry-run]}"
DRY_RUN="${2:-}"

DOMAIN="atlasit.pro"
HOSTED_ZONE_ID="${ROUTE53_ZONE_ID:-}"
CF_DIST_DOMAIN="${CLOUDFRONT_DOMAIN:-}"

# Auto-discover if not set
if [ -z "$HOSTED_ZONE_ID" ]; then
  HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN" \
    --query "HostedZones[0].Id" --output text | sed 's|/hostedzone/||')
fi

if [ -z "$CF_DIST_DOMAIN" ]; then
  CF_DIST_DOMAIN=$(aws ssm get-parameter --name "/atlasit/dev/cloudfront-distribution-id" \
    --query "Parameter.Value" --output text 2>/dev/null || echo "")
  if [ -n "$CF_DIST_DOMAIN" ]; then
    CF_DIST_DOMAIN=$(aws cloudfront get-distribution --id "$CF_DIST_DOMAIN" \
      --query "Distribution.DomainName" --output text 2>/dev/null || echo "")
  fi
fi

echo "==> DNS Cutover: Phase '$PHASE'"
echo "    Domain:       $DOMAIN"
echo "    Zone ID:      $HOSTED_ZONE_ID"
echo "    CloudFront:   $CF_DIST_DOMAIN"
echo "    Dry run:      ${DRY_RUN:-no}"
echo ""

apply_change() {
  local CHANGE_BATCH="$1"
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "    [DRY RUN] Would apply:"
    echo "$CHANGE_BATCH" | jq .
  else
    aws route53 change-resource-record-sets \
      --hosted-zone-id "$HOSTED_ZONE_ID" \
      --change-batch "$CHANGE_BATCH"
    echo "    Applied successfully"
  fi
}

case "$PHASE" in
  pre-lower-ttl)
    echo "--- Lowering TTL to 60s on all records ---"
    echo "    NOTE: Run this 72 hours before cutover"
    echo "    This must be done in Cloudflare dashboard or API"
    echo "    (Cloudflare manages DNS until cutover)"
    echo ""
    echo "    Cloudflare API command:"
    echo "    curl -X PATCH 'https://api.cloudflare.com/client/v4/zones/<zone-id>/dns_records/<record-id>' \\"
    echo "      -H 'Authorization: Bearer \$CLOUDFLARE_API_TOKEN' \\"
    echo "      -d '{\"ttl\": 60}'"
    ;;

  canary-1pct)
    echo "--- Canary: 1% to AWS ---"
    CHANGE=$(cat <<EOJSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "SetIdentifier": "aws-cloudfront",
        "Weight": 1,
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DIST_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOJSON
)
    apply_change "$CHANGE"
    echo ""
    echo "    Monitor: CloudWatch, API Gateway 5xx, Lambda errors"
    echo "    Rollback: ./scripts/dns-cutover.sh rollback"
    ;;

  canary-20pct)
    echo "--- Canary: 20% to AWS ---"
    CHANGE=$(cat <<EOJSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "SetIdentifier": "aws-cloudfront",
        "Weight": 51,
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DIST_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOJSON
)
    apply_change "$CHANGE"
    ;;

  split-50)
    echo "--- 50/50 split ---"
    CHANGE=$(cat <<EOJSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "SetIdentifier": "aws-cloudfront",
        "Weight": 128,
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DIST_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOJSON
)
    apply_change "$CHANGE"
    ;;

  aws-majority)
    echo "--- 99% to AWS ---"
    CHANGE=$(cat <<EOJSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "SetIdentifier": "aws-cloudfront",
        "Weight": 255,
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DIST_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOJSON
)
    apply_change "$CHANGE"
    ;;

  aws-full)
    echo "--- 100% AWS (remove Cloudflare weighted record) ---"
    echo "    After this, update nameservers at registrar to Route 53"
    CHANGE=$(cat <<EOJSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DIST_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOJSON
)
    apply_change "$CHANGE"
    echo ""
    echo "    NEXT: Update nameservers at your registrar to:"
    aws route53 get-hosted-zone --id "$HOSTED_ZONE_ID" \
      --query "DelegationSet.NameServers" --output text 2>/dev/null || echo "    (run: aws route53 get-hosted-zone --id $HOSTED_ZONE_ID)"
    ;;

  rollback)
    echo "--- ROLLBACK: 100% to Cloudflare ---"
    CHANGE=$(cat <<EOJSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "SetIdentifier": "aws-cloudfront",
        "Weight": 0,
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DIST_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOJSON
)
    apply_change "$CHANGE"
    echo "    Traffic shifted back to Cloudflare (takes effect within TTL)"
    ;;

  restore-ttl)
    echo "--- Restoring TTL to 300s ---"
    echo "    Run this after 2+ weeks of stable AWS-only traffic"
    echo "    Update TTL in Route 53 and/or Terraform"
    ;;

  *)
    echo "Unknown phase: $PHASE"
    echo "Valid: pre-lower-ttl, canary-1pct, canary-20pct, split-50, aws-majority, aws-full, rollback, restore-ttl"
    exit 1
    ;;
esac

echo ""
echo "==> Phase '$PHASE' complete"
