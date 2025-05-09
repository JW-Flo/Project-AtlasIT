#!/bin/bash
set -euo pipefail

LOG="local-test-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

trap 'echo "[ERROR] Script failed at line $LINENO. See $LOG for details."; exit 1' ERR

# Load .env if present
if [ -f .env ]; then
  echo "[INFO] Loading .env file"
  set -a
  source .env
  set +a
fi

# Set dry-run mode for local testing (doesn't push to cloud)
export DRY_RUN=true
export GCP_PROJECT_ID=${GCP_PROJECT_ID:-ignite-459301}

echo "[INFO] === Running Terraform ==="
(cd terraform && terraform init && terraform plan)

echo "[INFO] === Running Shell Scripts ==="
for script in scripts/*.sh; do
  if [[ "$script" != *local-test.sh ]]; then
    echo "[INFO] Running $script"
    bash "$script"
  fi
  echo "[INFO] Completed $script"
done

# Docker build (required)
if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker is required but not installed."
  if command -v brew >/dev/null 2>&1; then
    echo "[INFO] Attempting to install Docker Desktop via Homebrew..."
    brew install --cask docker
    echo "[INFO] Docker Desktop installed. Please launch Docker Desktop from your Applications folder and ensure it is running, then re-run this script."
  else
    echo "[INFO] Please download and install Docker Desktop for Mac from:"
    echo "      https://www.docker.com/products/docker-desktop/"
    open "https://www.docker.com/products/docker-desktop/"
  fi
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon is not running. Please start Docker Desktop and ensure it is running, then re-run this script."
  exit 1
fi

echo "[INFO] === Building Docker Image ==="
if ! docker build -t ignite-dashboard -f docker/Dockerfile .; then
  echo "[ERROR] Docker build failed. Check Dockerfile and build context."
  exit 1
fi

echo "[INFO] === Running Python Lint & Tests ==="
# Check if pylint is installed, install if not
if ! command -v pylint >/dev/null 2>&1; then
  echo "[INFO] pylint not found, installing..."
  pip install pylint
fi

# Check if pytest is installed, install if not
if ! command -v pytest >/dev/null 2>&1; then
  echo "[INFO] pytest not found, installing..."
  pip install pytest
fi

# Run linting and tests
pylint dashboard/app.py cloud-functions/ingest_alerts.py || true
pytest cloud-functions/ || true

echo "[INFO] === Local test complete. Log: $LOG ==="
