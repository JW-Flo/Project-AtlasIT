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
