resource "cloudflare_workers_kv_namespace" "tenant_limits" {
  title = "atlasit-tenant-limits-${var.environment}"
}

resource "cloudflare_d1_database" "main" {
  name = "atlasit-${var.environment}-d1"
}

resource "cloudflare_r2_bucket" "artifacts" {
  account_id = var.cloudflare_account_id
  name       = "atlasit-${var.environment}-artifacts"
}

resource "cloudflare_worker_script" "core_api" {
  account_id = var.cloudflare_account_id
  name       = "atlasit-core-api-${var.environment}"
  content    = var.core_api_worker_content

  kv_namespace_binding {
    name         = "RATE_LIMIT_KV"
    namespace_id = cloudflare_workers_kv_namespace.tenant_limits.id
  }

  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.main.id
  }

  r2_bucket_binding {
    name        = "EVIDENCE_BUCKET"
    bucket_name = cloudflare_r2_bucket.artifacts.name
  }
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.tenant_limits.id
}

output "d1_database_id" {
  value = cloudflare_d1_database.main.id
}

output "r2_bucket_name" {
  value = cloudflare_r2_bucket.artifacts.name
}
