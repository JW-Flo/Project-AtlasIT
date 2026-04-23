# Lambda functions — one per migrated Worker
# Uses esbuild-bundled artifacts from lambdas/ directory

locals {
  lambda_defaults = {
    runtime     = "nodejs20.x"
    memory_size = 256
    timeout     = 30
    handler     = "handler.handler"
  }

  common_env = {
    NODE_ENV       = var.env
    AWS_REGION_APP = var.region
    EVIDENCE_BUCKET    = aws_s3_bucket.evidence.bucket
    POLICIES_BUCKET    = aws_s3_bucket.policies.bucket
    ARTIFACTS_BUCKET   = aws_s3_bucket.artifacts.bucket
    IDEMPOTENCY_TABLE  = aws_dynamodb_table.idempotency.name
    SESSIONS_TABLE     = aws_dynamodb_table.sessions.name
    CACHE_TABLE        = aws_dynamodb_table.cache.name
    FLAGS_TABLE        = aws_dynamodb_table.feature_flags.name
    EVENT_BUS_NAME     = aws_cloudwatch_event_bus.atlasit.name
    SQS_STEP_TASKS_URL     = aws_sqs_queue.step_tasks.url
    # DATABASE_URL set manually via CLI (host/port/dbname/user + SSL params).
    # Password is fetched at runtime from Secrets Manager via RDS_SECRET_ARN
    # env var, so rotation no longer breaks Lambda connections.
    # RDS_SECRET_ARN also set via CLI — points to the RDS-managed secret.
    SSM_PREFIX             = "/atlasit/${var.env}"
  }

  lambda_vpc_config = {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
}

# --- IAM execution role for all Lambda functions ---

resource "aws_iam_role" "lambda_exec" {
  name = "atlasit-lambda-exec-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_policy" "lambda_app" {
  name = "atlasit-lambda-app-${var.env}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
          "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan",
          "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.idempotency.arn,
          aws_dynamodb_table.sessions.arn,
          aws_dynamodb_table.cache.arn,
          aws_dynamodb_table.feature_flags.arn,
          "${aws_dynamodb_table.sessions.arn}/index/*",
          "${aws_dynamodb_table.cache.arn}/index/*",
        ]
      },
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
          "s3:ListBucket", "s3:PutObjectTagging"
        ]
        Resource = [
          aws_s3_bucket.evidence.arn, "${aws_s3_bucket.evidence.arn}/*",
          aws_s3_bucket.policies.arn, "${aws_s3_bucket.policies.arn}/*",
          aws_s3_bucket.artifacts.arn, "${aws_s3_bucket.artifacts.arn}/*",
        ]
      },
      {
        Sid      = "EventBridge"
        Effect   = "Allow"
        Action   = ["events:PutEvents"]
        Resource = [aws_cloudwatch_event_bus.atlasit.arn]
      },
      {
        Sid      = "SQS"
        Effect   = "Allow"
        Action   = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = [aws_sqs_queue.step_tasks.arn, aws_sqs_queue.step_tasks_dlq.arn]
      },
      {
        Sid      = "RDSConnect"
        Effect   = "Allow"
        Action   = ["rds-db:connect"]
        Resource = ["arn:aws:rds-db:${var.region}:${var.account_id}:dbuser:*/atlasit_app"]
      },
      {
        Sid      = "StepFunctions"
        Effect   = "Allow"
        Action   = ["states:StartExecution", "states:DescribeExecution", "states:StopExecution"]
        Resource = ["arn:aws:states:${var.region}:${var.account_id}:stateMachine:atlasit-*-${var.env}"]
      },
      {
        Sid      = "SSMRead"
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = ["arn:aws:ssm:${var.region}:${var.account_id}:parameter/atlasit/${var.env}/*"]
      },
      {
        Sid      = "SecretsManagerRds"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [aws_db_instance.main.master_user_secret[0].secret_arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_app" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_app.arn
}

# --- Lambda functions ---
# Placeholder resources — actual code deployed via CI/CD pipeline

resource "aws_lambda_function" "core_api" {
  function_name = "atlasit-core-api-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = local.lambda_defaults.handler
  memory_size   = 512
  timeout       = local.lambda_defaults.timeout
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = local.common_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

resource "aws_lambda_function" "compliance_api" {
  function_name = "atlasit-compliance-api-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = local.lambda_defaults.handler
  memory_size   = local.lambda_defaults.memory_size
  timeout       = local.lambda_defaults.timeout
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = local.common_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

resource "aws_lambda_function" "orchestrator" {
  function_name = "atlasit-orchestrator-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = local.lambda_defaults.handler
  memory_size   = 512
  timeout       = 60
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = local.common_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

resource "aws_lambda_function" "onboarding_api" {
  function_name = "atlasit-onboarding-api-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = local.lambda_defaults.handler
  memory_size   = local.lambda_defaults.memory_size
  timeout       = local.lambda_defaults.timeout
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = local.common_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

resource "aws_lambda_function" "scheduler" {
  function_name = "atlasit-scheduler-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = local.lambda_defaults.handler
  memory_size   = local.lambda_defaults.memory_size
  timeout       = 60
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = local.common_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

resource "aws_lambda_function" "slack_handler" {
  function_name = "atlasit-slack-handler-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = local.lambda_defaults.handler
  memory_size   = 128
  timeout       = local.lambda_defaults.timeout
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = local.common_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

resource "aws_lambda_function" "dlq_processor" {
  function_name = "atlasit-dlq-processor-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = local.lambda_defaults.handler
  memory_size   = 128
  timeout       = 60
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = local.common_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

# Placeholder zip for initial terraform apply (CI/CD replaces with real code)
data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 503, body: 'Not yet deployed' });"
    filename = "handler.js"
  }
}

# --- API Gateway Lambda permissions ---

resource "aws_lambda_permission" "apigw_core" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.core_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_compliance" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_orchestrator" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orchestrator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_onboarding" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.onboarding_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_slack" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# --- SQS Lambda trigger (queue consumer replaces CF Queue consumer) ---

resource "aws_lambda_event_source_mapping" "step_tasks" {
  event_source_arn                   = aws_sqs_queue.step_tasks.arn
  function_name                      = aws_lambda_function.orchestrator.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  enabled                            = true
}

resource "aws_lambda_event_source_mapping" "dlq" {
  event_source_arn                   = aws_sqs_queue.step_tasks_dlq.arn
  function_name                      = aws_lambda_function.dlq_processor.arn
  batch_size                         = 1
  enabled                            = true
}
