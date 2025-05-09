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
