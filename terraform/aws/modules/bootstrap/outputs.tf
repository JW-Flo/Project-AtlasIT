output "state_bucket_arn" {
  value       = aws_s3_bucket.tfstate.arn
  description = "ARN of the Terraform state S3 bucket"
}

output "state_bucket_name" {
  value       = aws_s3_bucket.tfstate.bucket
  description = "Name of the Terraform state S3 bucket"
}

output "lock_table_name" {
  value       = aws_dynamodb_table.tflock.name
  description = "Name of the Terraform state lock DynamoDB table"
}
