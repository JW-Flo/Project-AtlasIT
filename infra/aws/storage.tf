resource "aws_s3_bucket" "evidence" {
  bucket = "atlasit-evidence-${var.env}-${var.account_id}"
}

resource "aws_s3_bucket_versioning" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_lifecycle_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  rule {
    id     = "evidence-retention"
    status = "Enabled"
    filter {
      prefix = "sha256/"
    }
    transition {
      days          = 30
      storage_class = "GLACIER"
    }
    expiration {
      days = 365
    }
  }
}

resource "aws_dynamodb_table" "idempotency" {
  name         = "atlasit-idem-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"
  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_iam_policy" "s3_write" {
  name   = "atlasit-s3-write-${var.env}"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid    = "WriteEvidence",
      Effect = "Allow",
      Action = ["s3:PutObject", "s3:PutObjectTagging"],
      Resource = "${aws_s3_bucket.evidence.arn}/sha256/*"
    }]
  })
}

resource "aws_iam_policy" "ddb_tokens" {
  name   = "atlasit-ddb-tokens-${var.env}"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid    = "IdempotencyRW",
      Effect = "Allow",
      Action = ["dynamodb:PutItem","dynamodb:DeleteItem","dynamodb:GetItem"],
      Resource = aws_dynamodb_table.idempotency.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach_s3" {
  role       = aws_iam_role.atlasit_hybrid_role.name
  policy_arn = aws_iam_policy.s3_write.arn
}

resource "aws_iam_role_policy_attachment" "attach_ddb" {
  role       = aws_iam_role.atlasit_hybrid_role.name
  policy_arn = aws_iam_policy.ddb_tokens.arn
}

# --- Additional S3 buckets (R2 replacements) ---

resource "aws_s3_bucket" "policies" {
  bucket = "atlasit-policies-${var.env}-${var.account_id}"
}

resource "aws_s3_bucket_versioning" "policies" {
  bucket = aws_s3_bucket.policies.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket" "artifacts" {
  bucket = "atlasit-artifacts-${var.env}-${var.account_id}"
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration { status = "Enabled" }
}

# Console SPA static assets
resource "aws_s3_bucket" "console" {
  bucket = "atlasit-console-${var.env}-${var.account_id}"
}

resource "aws_s3_bucket_policy" "console_oac" {
  bucket = aws_s3_bucket.console.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.console.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
        }
      }
    }]
  })
}

# Access logs bucket
resource "aws_s3_bucket" "logs" {
  bucket = "atlasit-logs-${var.env}-${var.account_id}"
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "expire-old-logs"
    status = "Enabled"
    expiration {
      days = 90
    }
  }
}

# --- Additional DynamoDB tables (KV replacements) ---

# Sessions (replaces KV_SESSIONS)
resource "aws_dynamodb_table" "sessions" {
  name         = "atlasit-sessions-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# Cache (replaces KV_CACHE)
resource "aws_dynamodb_table" "cache" {
  name         = "atlasit-cache-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# Feature flags (replaces KV_FEATURE_FLAGS)
resource "aws_dynamodb_table" "feature_flags" {
  name         = "atlasit-feature-flags-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }
}
