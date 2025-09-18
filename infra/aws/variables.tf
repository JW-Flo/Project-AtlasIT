variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "env" {
  description = "Deployment environment label (e.g., dev, staging)"
  type        = string
  default     = "dev"
}

variable "account_id" {
  description = "AWS Account ID (12 digits)"
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the AWS IAM OIDC provider trusted for web identity (pre-created)"
  type        = string
}

variable "oidc_subject_pattern" {
  description = "Subject claim pattern permitted to assume role (e.g., project-atlasit/*)"
  type        = string
  default     = "project-atlasit/*"
}
