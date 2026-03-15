data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "atlasit-${var.function_name}-${var.env}-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "xray" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# DynamoDB access
resource "aws_iam_policy" "dynamodb" {
  count = var.enable_dynamodb ? 1 : 0
  name  = "atlasit-${var.function_name}-${var.env}-dynamodb"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:BatchWriteItem",
          "dynamodb:UpdateItem",
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "dynamodb" {
  count      = var.enable_dynamodb ? 1 : 0
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.dynamodb[0].arn
}

# S3 access
resource "aws_iam_policy" "s3" {
  count = var.enable_s3 ? 1 : 0
  name  = "atlasit-${var.function_name}-${var.env}-s3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:HeadObject",
        ]
        Resource = "${var.s3_bucket_arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3" {
  count      = var.enable_s3 ? 1 : 0
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.s3[0].arn
}

# SSM access
resource "aws_iam_policy" "ssm" {
  count = var.enable_ssm ? 1 : 0
  name  = "atlasit-${var.function_name}-${var.env}-ssm"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = "arn:aws:ssm:*:*:parameter${var.ssm_prefix}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  count      = var.enable_ssm ? 1 : 0
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.ssm[0].arn
}

# Additional policies
resource "aws_iam_role_policy_attachment" "additional" {
  count      = length(var.additional_policies)
  role       = aws_iam_role.lambda.name
  policy_arn = var.additional_policies[count.index]
}
