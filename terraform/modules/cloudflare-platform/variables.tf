variable "cloudflare_account_id" {
  type = string
}

variable "environment" {
  type = string
}

variable "core_api_worker_content" {
  description = "Compiled core-api worker bundle content"
  type        = string
}
