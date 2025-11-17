#!/usr/bin/env bash
set -euo pipefail

# deploy-connect.sh
# Local helper script to stand up 1Password Connect (API + Sync) on a target host via SSH.
# Usage:
#   HOST=user@remote ./scripts/deploy-connect.sh latest credentials.json
# Args:
#   $1 (optional) VERSION tag (default latest)
#   $2 (optional) path to credentials.json (default ./credentials.json)

VERSION=${1:-latest}
CREDS_PATH=${2:-credentials.json}

if [ -z "${HOST:-}" ]; then
  echo "HOST env var required (user@host)" >&2
  exit 1
fi
if [ ! -f "$CREDS_PATH" ]; then
  echo "Credentials file '$CREDS_PATH' not found" >&2
  exit 1
fi

scp -o StrictHostKeyChecking=no "$CREDS_PATH" "$HOST":~/credentials.json

ssh -o StrictHostKeyChecking=no "$HOST" bash -s <<EOF
set -euo pipefail
VERSION='$VERSION'
echo "Deploying 1Password Connect version: $VERSION"

docker pull 1password/connect-sync:$VERSION
docker pull 1password/connect-api:$VERSION
docker pull 1password/connect-sync:$VERSION

docker network inspect connect-net >/dev/null 2>&1 || docker network create connect-net
mkdir -p ~/connect-data
mv ~/credentials.json ~/connect-data/credentials.json || true

if ! docker ps --format '{{.Names}}' | grep -q connect-sync; then
  docker run -d --name connect-sync --restart unless-stopped \
    -v ~/connect-data:/root/.op \
    --network connect-net \
    1password/connect-sync:$VERSION
fi
if ! docker ps --format '{{.Names}}' | grep -q connect-api; then
  docker run -d --name connect-api --restart unless-stopped \
    -v ~/connect-data:/root/.op \
    -p 8080:8080 \
    --network connect-net \
    1password/connect-api:$VERSION
fi

docker ps --filter name=connect- --format 'table {{.Names}}\t{{.Status}}'
EOF

echo "Deployment complete. Health check:"
if command -v curl >/dev/null; then
  curl -k -s -o /dev/null -w '%{http_code}\n' "${OP_CONNECT_HOST:-https://example:8080}/health" || true
fi
