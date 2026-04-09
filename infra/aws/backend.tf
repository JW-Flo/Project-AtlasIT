# Remote state backend — S3 + DynamoDB for locking
# Run `terraform init` after uncommenting to migrate from local state

# resource "aws_s3_bucket" "tfstate" {
#   bucket = "atlasit-terraform-state-${var.account_id}"
# }
#
# resource "aws_s3_bucket_versioning" "tfstate" {
#   bucket = aws_s3_bucket.tfstate.id
#   versioning_configuration { status = "Enabled" }
# }
#
# resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
#   bucket = aws_s3_bucket.tfstate.id
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "aws:kms"
#     }
#   }
# }
#
# resource "aws_s3_bucket_public_access_block" "tfstate" {
#   bucket                  = aws_s3_bucket.tfstate.id
#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }
#
# resource "aws_dynamodb_table" "tflock" {
#   name         = "atlasit-terraform-locks"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "LockID"
#   attribute {
#     name = "LockID"
#     type = "S"
#   }
# }

# After creating the above resources, add this backend block to providers.tf:
# backend "s3" {
#   bucket         = "atlasit-terraform-state-457335975503"
#   key            = "aws/terraform.tfstate"
#   region         = "us-east-1"
#   encrypt        = true
#   dynamodb_table = "atlasit-terraform-locks"
# }
