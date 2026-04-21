# Console SSR Lambda - handles SvelteKit SSR + API routes
# Runs full SvelteKit app with adapter-node
# CloudFront routes /api/* and /console/* to this Lambda

resource "aws_lambda_function" "console_api" {
  function_name = "atlasit-console-api-${var.env}"
  role          = aws_iam_role.console_api_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  # Placeholder code - will be updated by CI/CD
  filename         = data.archive_file.console_api_placeholder.output_path
  source_code_hash = data.archive_file.console_api_placeholder.output_base64sha256

  # VPC config for RDS access
  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda_rds.id]
  }

  environment {
    variables = {
      NODE_ENV     = var.env
      DATABASE_URL = "postgresql://${aws_db_instance.atlasit.username}:${random_password.db_password.result}@${aws_db_instance.atlasit.endpoint}/${aws_db_instance.atlasit.db_name}"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(var.common_tags, {
    Name = "atlasit-console-api-${var.env}"
  })

  lifecycle {
    ignore_changes = [
      environment[0].variables["DATABASE_URL"],
      filename,
      source_code_hash,
    ]
  }
}

# Placeholder Lambda code
data "archive_file" "console_api_placeholder" {
  type        = "zip"
  output_path = "/tmp/console-api-placeholder.zip"

  source {
    content  = <<-EOT
      exports.handler = async (event) => ({
        statusCode: 503,
        body: JSON.stringify({ error: "Console API not yet deployed" })
      });
    EOT
    filename = "index.js"
  }
}

# IAM role
resource "aws_iam_role" "console_api_lambda" {
  name = "atlasit-console-api-lambda-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "console_api_vpc" {
  role       = aws_iam_role.console_api_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "console_api_ssm" {
  name = "ssm-read"
  role = aws_iam_role.console_api_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
      ]
      Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/atlasit/${var.env}/*"
    }]
  })
}

# Lambda Function URL
resource "aws_lambda_function_url" "console_api" {
  function_name      = aws_lambda_function.console_api.function_name
  authorization_type = "NONE"

  cors {
    allow_origins     = ["https://*.${var.domain}", "https://${var.domain}"]
    allow_methods     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age           = 86400
    allow_credentials = true
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "console_api" {
  name              = "/aws/lambda/atlasit-console-api-${var.env}"
  retention_in_days = 30

  tags = var.common_tags
}

output "console_api_function_name" {
  value       = aws_lambda_function.console_api.function_name
  description = "Console API Lambda function name"
}

output "console_api_function_url" {
  value       = aws_lambda_function_url.console_api.function_url
  description = "Console API Lambda Function URL"
}
