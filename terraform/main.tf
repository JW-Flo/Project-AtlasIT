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

# Placeholder KV namespace definitions (import existing ones later with terraform import)
# Example:
# resource "cloudflare_workers_kv_namespace" "mcp_store" {
#   title = "MCP_STORE"
# }

# Placeholder for D1 - currently managed outside Terraform (Wrangler). Track decision in docs.

output "note" {
  value = "Phase 0 baseline: resources intentionally minimal."
}
