variable "region" {
  description = "AWS region"
  type        = string
}

variable "env" {
  description = "Deployment environment label (e.g., dev, staging)"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID (12 digits)"
  type        = string
}

variable "groq_api_key" {
  description = "Groq API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
  default     = ""
}
