output "bucket_name" {
  description = "S3 evidence bucket name"
  value       = aws_s3_bucket.evidence.bucket
}

output "bucket_arn" {
  description = "S3 evidence bucket ARN"
  value       = aws_s3_bucket.evidence.arn
}
