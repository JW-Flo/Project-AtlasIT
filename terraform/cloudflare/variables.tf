variable "cloudflare_api_token" {
  description = "Cloudflare API token with Workers and KV permissions"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "ai_api_key" {
  description = "API key for AI services"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret for JWT signing"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Primary Cloudflare region"
  type        = string
  default     = "auto"
}
