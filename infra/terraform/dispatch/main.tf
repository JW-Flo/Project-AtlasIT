terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 4.0.0"
    }
  }

  # Remote state — encrypted at rest, locking via DynamoDB
  # backend "s3" {
  #   bucket         = "atlasit-terraform-state"
  #   key            = "aws/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "atlasit-terraform-locks"
  # }
}

provider "cloudflare" { api_token = var.api_token }

variable "account_id" { type = string }
variable "api_token" {
  type      = string
  sensitive = true
}
variable "worker_name" {
  type    = string
  default = "atlasit-dispatch"
}

resource "cloudflare_worker" "dispatch" {
  account_id    = var.account_id
  name          = var.worker_name
  observability = { enabled = true }
}

resource "cloudflare_worker_version" "dispatch_v1" {
  account_id         = var.account_id
  worker_id          = cloudflare_worker.dispatch.id
  compatibility_date = substr(timestamp(), 0, 10)
  main_module        = "build/index.js"
  modules = [{
    name         = "build/index.js"
    content_type = "application/javascript+module"
    content_file = "build/index.js"
  }]
}

resource "cloudflare_workers_deployment" "dispatch_prod" {
  account_id  = var.account_id
  script_name = cloudflare_worker.dispatch.name
  strategy    = "percentage"
  versions    = [{ percentage = 100, version_id = cloudflare_worker_version.dispatch_v1.id }]
}

output "dispatch_worker_id" { value = cloudflare_worker.dispatch.id }
