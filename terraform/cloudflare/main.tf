terraform {
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

# KV Namespace for state management
resource "cloudflare_workers_kv_namespace" "state" {
  title = "atlasit-state-${var.environment}"
}

# D1 Database for structured data
resource "cloudflare_d1_database" "main" {
  name = "atlasit-db-${var.environment}"
}

# Workers for each service
resource "cloudflare_worker_script" "onboarding" {
  name    = "atlasit-onboarding-${var.environment}"
  content = file("${path.module}/../../onboarding/dist/worker.js")

  kv_namespace_binding {
    name         = "STATE"
    namespace_id = cloudflare_workers_kv_namespace.state.id
  }

  d1_database_binding {
    name         = "DB"
    database_id  = cloudflare_d1_database.main.id
  }

  secret_text_binding {
    name = "AI_API_KEY"
    text = var.ai_api_key
  }
}

resource "cloudflare_worker_script" "marketplace" {
  name    = "atlasit-marketplace-${var.environment}"
  content = file("${path.module}/../../marketplace/dist/worker.js")

  kv_namespace_binding {
    name         = "STATE"
    namespace_id = cloudflare_workers_kv_namespace.state.id
  }

  d1_database_binding {
    name         = "DB"
    database_id  = cloudflare_d1_database.main.id
  }
}

resource "cloudflare_worker_script" "auth" {
  name    = "atlasit-auth-${var.environment}"
  content = file("${path.module}/../../auth/dist/worker.js")

  kv_namespace_binding {
    name         = "STATE"
    namespace_id = cloudflare_workers_kv_namespace.state.id
  }

  d1_database_binding {
    name         = "DB"
    database_id  = cloudflare_d1_database.main.id
  }

  secret_text_binding {
    name = "JWT_SECRET"
    text = var.jwt_secret
  }
}

resource "cloudflare_worker_script" "orchestrator" {
  name    = "atlasit-orchestrator-${var.environment}"
  content = file("${path.module}/../../orchestrator/dist/worker.js")

  kv_namespace_binding {
    name         = "STATE"
    namespace_id = cloudflare_workers_kv_namespace.state.id
  }

  d1_database_binding {
    name         = "DB"
    database_id  = cloudflare_d1_database.main.id
  }
}

resource "cloudflare_worker_script" "api_manager" {
  name    = "atlasit-api-manager-${var.environment}"
  content = file("${path.module}/../../api-manager/dist/worker.js")

  kv_namespace_binding {
    name         = "STATE"
    namespace_id = cloudflare_workers_kv_namespace.state.id
  }
}
