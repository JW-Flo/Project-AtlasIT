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
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      NODE_ENV = var.env
      # DATABASE_URL managed via ignore_changes - set manually via CLI
    }
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [
      environment,
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
      Resource = "arn:aws:ssm:${var.region}:${var.account_id}:parameter/atlasit/${var.env}/*"
    }]
  })
}

# Lambda Function URL
resource "aws_lambda_function_url" "console_api" {
  function_name      = aws_lambda_function.console_api.function_name
  authorization_type = "NONE"

  cors {
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age           = 86400
    allow_credentials = false
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "console_api" {
  name              = "/aws/lambda/atlasit-console-api-${var.env}"
  retention_in_days = 30

}

output "console_api_function_name" {
  value       = aws_lambda_function.console_api.function_name
  description = "Console API Lambda function name"
}

output "console_api_function_url" {
  value       = aws_lambda_function_url.console_api.function_url
  description = "Console API Lambda Function URL"
}
