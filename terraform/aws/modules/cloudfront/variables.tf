variable "env" {
  description = "Deployment environment label (e.g., dev, staging)"
  type        = string
}

variable "static_bucket_domain" {
  description = "Regional domain name of the S3 static assets bucket"
  type        = string
}

variable "static_bucket_id" {
  description = "ID of the S3 static assets bucket"
  type        = string
}

variable "ssr_lambda_function_url" {
  description = "Lambda Function URL for the SSR handler"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (optional)"
  type        = string
  default     = ""
}

variable "domain_aliases" {
  description = "Custom domain aliases for the distribution"
  type        = list(string)
  default     = []
}
