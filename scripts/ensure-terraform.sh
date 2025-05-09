#!/bin/bash
set -euo pipefail

# Ensure terraform directory and main.tf exist
mkdir -p terraform
if [ ! -f terraform/main.tf ]; then
  cat > terraform/main.tf <<EOF
terraform {
  required_version = ">= 1.0.0"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "ignite-459301"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

output "project_id" {
  value = var.project_id
}
EOF
fi

# Stage, commit, and push
if git status --porcelain | grep terraform/main.tf; then
  git add terraform/main.tf
  git commit -m "Ensure terraform directory and main.tf exist for CI pipeline" || true
  git push origin main
fi
