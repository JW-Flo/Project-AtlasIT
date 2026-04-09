output "event_bus_arn" {
  value       = aws_cloudwatch_event_bus.atlasit.arn
  description = "ARN of the AtlasIT EventBridge bus"
}

output "evidence_bucket" {
  value       = aws_s3_bucket.evidence.bucket
  description = "S3 bucket for evidence storage"
}

output "policies_bucket" {
  value       = aws_s3_bucket.policies.bucket
  description = "S3 bucket for policy documents"
}

output "artifacts_bucket" {
  value       = aws_s3_bucket.artifacts.bucket
  description = "S3 bucket for compliance artifacts"
}

output "console_bucket" {
  value       = aws_s3_bucket.console.bucket
  description = "S3 bucket for console SPA static assets"
}

output "idempotency_table" {
  value       = aws_dynamodb_table.idempotency.name
  description = "DynamoDB table for idempotency tokens"
}

output "sessions_table" {
  value       = aws_dynamodb_table.sessions.name
  description = "DynamoDB table for session storage"
}

output "cache_table" {
  value       = aws_dynamodb_table.cache.name
  description = "DynamoDB table for general cache"
}

output "feature_flags_table" {
  value       = aws_dynamodb_table.feature_flags.name
  description = "DynamoDB table for feature flags"
}

output "hybrid_role_arn" {
  value       = aws_iam_role.atlasit_hybrid_role.arn
  description = "IAM role ARN assumed via web identity"
}

output "lambda_exec_role_arn" {
  value       = aws_iam_role.lambda_exec.arn
  description = "IAM role ARN for Lambda execution"
}

output "api_gateway_url" {
  value       = aws_apigatewayv2_api.main.api_endpoint
  description = "API Gateway HTTP API endpoint URL"
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.main.domain_name
  description = "CloudFront distribution domain name"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.main.id
  description = "CloudFront distribution ID"
}

output "route53_zone_id" {
  value       = aws_route53_zone.primary.zone_id
  description = "Route 53 hosted zone ID"
}

output "route53_nameservers" {
  value       = aws_route53_zone.primary.name_servers
  description = "Route 53 nameservers (update at registrar)"
}

output "sqs_step_tasks_url" {
  value       = aws_sqs_queue.step_tasks.url
  description = "SQS queue URL for step task dispatch"
}

output "sqs_dlq_url" {
  value       = aws_sqs_queue.step_tasks_dlq.url
  description = "SQS dead-letter queue URL"
}

output "waf_web_acl_arn" {
  value       = aws_wafv2_web_acl.edge.arn
  description = "WAF WebACL ARN attached to CloudFront"
}
