output "bucket_id" {
  description = "S3 static bucket ID"
  value       = aws_s3_bucket.static.id
}

output "bucket_arn" {
  description = "S3 static bucket ARN"
  value       = aws_s3_bucket.static.arn
}

output "bucket_regional_domain_name" {
  description = "S3 static bucket regional domain name"
  value       = aws_s3_bucket.static.bucket_regional_domain_name
}
