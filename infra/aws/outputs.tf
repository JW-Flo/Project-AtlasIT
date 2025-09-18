output "event_bus_arn" {
  value       = aws_cloudwatch_event_bus.atlasit.arn
  description = "ARN of the AtlasIT EventBridge bus"
}

output "evidence_bucket" {
  value       = aws_s3_bucket.evidence.bucket
  description = "S3 bucket name used for evidence mirroring"
}

output "idempotency_table" {
  value       = aws_dynamodb_table.idempotency.name
  description = "DynamoDB table used for idempotency tokens"
}

output "hybrid_role_arn" {
  value       = aws_iam_role.atlasit_hybrid_role.arn
  description = "IAM role ARN assumed via web identity"
}
