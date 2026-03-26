#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="sonarqube-local"
IMAGE_TAG="sonarqube:2025.1-community"
VOLUME_NAME="sonarqube_data"
PORT_MAPPING="9000:9000"

echo "[sonar-upgrade] Ensuring docker is available..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found in PATH" >&2
  exit 1
fi

echo "[sonar-upgrade] Creating volume if missing: $VOLUME_NAME"
docker volume create "$VOLUME_NAME" >/dev/null 2>&1 || true

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[sonar-upgrade] Stopping running container $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME" >/dev/null
  fi
  echo "[sonar-upgrade] Removing existing container $CONTAINER_NAME"
  docker rm "$CONTAINER_NAME" >/dev/null
fi

echo "[sonar-upgrade] Pulling image $IMAGE_TAG"
docker pull "$IMAGE_TAG" >/dev/null

echo "[sonar-upgrade] Starting upgraded container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT_MAPPING" \
  -v "$VOLUME_NAME:/opt/sonarqube/data" \
  "$IMAGE_TAG" >/dev/null

echo "[sonar-upgrade] Container started. Waiting for readiness (approx 25-60s)..."
ATTEMPTS=0
until curl -sf "http://localhost:9000/api/system/status" | grep -q 'UP'; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -gt 40 ]; then
    echo "[sonar-upgrade] Timed out waiting for SonarQube to become UP" >&2
    docker logs "$CONTAINER_NAME" | tail -n 100 >&2 || true
    exit 1
  fi
  sleep 2
done

echo "[sonar-upgrade] SonarQube is UP on http://localhost:9000"
echo "[sonar-upgrade] Next: export SONAR_TOKEN=your_local_token && npm run sonar:scan"
