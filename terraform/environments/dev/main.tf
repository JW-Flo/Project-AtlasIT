terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

module "cloudflare_platform" {
  source = "../../modules/cloudflare-platform"

  cloudflare_account_id   = var.cloudflare_account_id
  environment             = "dev"
  core_api_worker_content = var.core_api_worker_content
}
