# Remote state backend resources (created manually, not managed by this Terraform config):
#   S3 bucket: atlasit-terraform-state-457335975503 (versioned, KMS encrypted, public access blocked)
#   DynamoDB table: atlasit-terraform-locks (PAY_PER_REQUEST, hash key: LockID)
#
# Backend config is in providers.tf → backend "s3" { ... }
