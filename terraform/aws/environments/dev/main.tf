terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "AtlasIT"
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}

# ---------------------------------------------------------------------------
# Evidence S3 Bucket
# ---------------------------------------------------------------------------

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
    filter {}
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "evidence" {
  bucket                  = aws_s3_bucket.evidence.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ---------------------------------------------------------------------------
# EventBridge Bus
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_event_bus" "atlasit" {
  name = "atlasit-${var.env}"
}

# ---------------------------------------------------------------------------
# GitHub OIDC
# ---------------------------------------------------------------------------

# NOTE: Skipped until terraform svc account has IAM permissions
# module "github_oidc" {
#   source = "../../modules/github-oidc"
# }

module "dynamodb" {
  source = "../../modules/dynamodb"
  env    = var.env
}

module "ssm_secrets" {
  source = "../../modules/ssm-secrets"
  env    = var.env
  secrets = {
    GROQ_API_KEY = nonsensitive(var.groq_api_key)
    JWT_SECRET   = nonsensitive(var.jwt_secret)
  }
}

module "cognito" {
  source = "../../modules/cognito"
  env    = var.env
}

# ---------------------------------------------------------------------------
# Lambda Layer
# ---------------------------------------------------------------------------

module "lambda_layer" {
  source         = "../../modules/lambda-layer"
  env            = var.env
  layer_zip_path = "${path.module}/../../../../packages/shared/dist/layer.zip"
}

# ---------------------------------------------------------------------------
# Lambda Functions
# ---------------------------------------------------------------------------

module "lambda_compliance_api" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "compliance-api"
  source_dir         = "${path.module}/../../../../lambdas/compliance-api/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  s3_bucket_arn      = aws_s3_bucket.evidence.arn
  enable_s3          = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME      = module.dynamodb.table_name
    EVIDENCE_BUCKET = aws_s3_bucket.evidence.bucket
    SSM_PREFIX      = "/atlasit/${var.env}"
    NODE_OPTIONS    = "--enable-source-maps"
  }
}

module "lambda_policy_api" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "policy-api"
  source_dir         = "${path.module}/../../../../lambdas/policy-api/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_automation_api" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "automation-api"
  source_dir         = "${path.module}/../../../../lambdas/automation-api/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_security_api" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "security-api"
  source_dir         = "${path.module}/../../../../lambdas/security-api/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_core_api" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "core-api"
  source_dir         = "${path.module}/../../../../lambdas/core-api/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_orchestrator" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "orchestrator"
  source_dir         = "${path.module}/../../../../lambdas/orchestrator/dist"
  memory_size        = 512
  timeout            = 60
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_scheduler" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "scheduler"
  source_dir         = "${path.module}/../../../../lambdas/scheduler/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_slack_handler" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "slack-handler"
  source_dir         = "${path.module}/../../../../lambdas/slack-handler/dist"
  memory_size        = 128
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_github_proxy" {
  source         = "../../modules/lambda"
  env            = var.env
  function_name  = "github-proxy"
  source_dir     = "${path.module}/../../../../lambdas/github-proxy/dist"
  memory_size    = 128
  layer_arns     = [module.lambda_layer.layer_arn]
  ssm_prefix     = "/atlasit/${var.env}"
  enable_ssm     = true
  environment_variables = {
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_onboarding_api" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "onboarding-api"
  source_dir         = "${path.module}/../../../../lambdas/onboarding-api/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

module "lambda_mcp_api" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "mcp-api"
  source_dir         = "${path.module}/../../../../lambdas/mcp-api/dist"
  memory_size        = 256
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

# ---------------------------------------------------------------------------
# Console SSR Lambda + Frontend Infrastructure
# ---------------------------------------------------------------------------

module "lambda_console_ssr" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "console-ssr"
  source_dir         = "${path.module}/../../../../lambdas/console-ssr/dist"
  memory_size        = 512
  timeout            = 30
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = module.dynamodb.table_arn
  enable_dynamodb    = true
  ssm_prefix         = "/atlasit/${var.env}"
  enable_ssm         = true
  environment_variables = {
    TABLE_NAME   = module.dynamodb.table_name
    SSM_PREFIX   = "/atlasit/${var.env}"
    NODE_OPTIONS = "--enable-source-maps"
  }
}

resource "aws_lambda_function_url" "console_ssr" {
  function_name      = module.lambda_console_ssr.function_name
  authorization_type = "NONE"
}

module "s3_static" {
  source     = "../../modules/s3-static"
  env        = var.env
  account_id = var.account_id
}

module "cloudfront" {
  source                  = "../../modules/cloudfront"
  env                     = var.env
  static_bucket_domain    = module.s3_static.bucket_regional_domain_name
  static_bucket_id        = module.s3_static.bucket_id
  ssr_lambda_function_url = aws_lambda_function_url.console_ssr.function_url
}

# ---------------------------------------------------------------------------
# SQS Queues
# ---------------------------------------------------------------------------

module "sqs" {
  source = "../../modules/sqs"
  env    = var.env
}

# ---------------------------------------------------------------------------
# EventBridge Rules
# ---------------------------------------------------------------------------

module "eventbridge_rules" {
  source               = "../../modules/eventbridge"
  env                  = var.env
  event_bus_name       = aws_cloudwatch_event_bus.atlasit.name
  event_bus_arn        = aws_cloudwatch_event_bus.atlasit.arn
  scheduler_lambda_arn = module.lambda_scheduler.function_arn
}

# ---------------------------------------------------------------------------
# Step Functions
# ---------------------------------------------------------------------------

module "step_functions" {
  source                      = "../../modules/step-functions"
  env                         = var.env
  workflow_executor_lambda_arn = module.lambda_orchestrator.function_arn
  dlq_arn                     = module.sqs.dlq_arns["workflow"]
}

# ---------------------------------------------------------------------------
# Observability (CloudWatch + X-Ray + Alarms)
# ---------------------------------------------------------------------------

module "observability" {
  source = "../../modules/observability"
  env    = var.env
  lambda_function_names = [
    "compliance-api", "policy-api", "automation-api", "security-api",
    "core-api", "orchestrator", "scheduler", "slack-handler",
    "github-proxy", "onboarding-api", "mcp-api", "console-ssr",
    "ws-connect", "ws-disconnect", "ws-broadcast",
  ]
  api_gateway_id            = module.api_gateway.api_id
  enable_api_gateway_alarms = true
  dlq_arns       = module.sqs.dlq_arns
}

# ---------------------------------------------------------------------------
# API Gateway
# ---------------------------------------------------------------------------

module "api_gateway" {
  source                = "../../modules/api-gateway"
  env                   = var.env
  cognito_user_pool_arn = module.cognito.user_pool_arn

  routes = {
    # Compliance API
    "GET /api/v1/evidence/{proxy+}"    = { method = "GET", lambda_arn = module.lambda_compliance_api.function_arn, lambda_invoke_arn = module.lambda_compliance_api.invoke_arn }
    "POST /api/v1/evidence/{proxy+}"   = { method = "POST", lambda_arn = module.lambda_compliance_api.function_arn, lambda_invoke_arn = module.lambda_compliance_api.invoke_arn }
    "GET /api/v1/snapshot/{proxy+}"    = { method = "GET", lambda_arn = module.lambda_compliance_api.function_arn, lambda_invoke_arn = module.lambda_compliance_api.invoke_arn }

    # Policy API
    "GET /api/v1/policies/{proxy+}"    = { method = "GET", lambda_arn = module.lambda_policy_api.function_arn, lambda_invoke_arn = module.lambda_policy_api.invoke_arn }
    "POST /api/v1/policies/{proxy+}"   = { method = "POST", lambda_arn = module.lambda_policy_api.function_arn, lambda_invoke_arn = module.lambda_policy_api.invoke_arn }
    "GET /api/v1/coverage/{proxy+}"    = { method = "GET", lambda_arn = module.lambda_policy_api.function_arn, lambda_invoke_arn = module.lambda_policy_api.invoke_arn }

    # Automation API
    "GET /api/v1/workflows/{proxy+}"   = { method = "GET", lambda_arn = module.lambda_automation_api.function_arn, lambda_invoke_arn = module.lambda_automation_api.invoke_arn }
    "POST /api/v1/workflows/{proxy+}"  = { method = "POST", lambda_arn = module.lambda_automation_api.function_arn, lambda_invoke_arn = module.lambda_automation_api.invoke_arn }

    # Security API
    "GET /api/v1/security/{proxy+}"         = { method = "GET", lambda_arn = module.lambda_security_api.function_arn, lambda_invoke_arn = module.lambda_security_api.invoke_arn }
    "POST /api/v1/security/{proxy+}"        = { method = "POST", lambda_arn = module.lambda_security_api.function_arn, lambda_invoke_arn = module.lambda_security_api.invoke_arn }
    "GET /api/v1/incidents/{proxy+}"        = { method = "GET", lambda_arn = module.lambda_security_api.function_arn, lambda_invoke_arn = module.lambda_security_api.invoke_arn }
    "POST /api/v1/incidents/{proxy+}"       = { method = "POST", lambda_arn = module.lambda_security_api.function_arn, lambda_invoke_arn = module.lambda_security_api.invoke_arn }
    "GET /api/v1/access-requests/{proxy+}"  = { method = "GET", lambda_arn = module.lambda_security_api.function_arn, lambda_invoke_arn = module.lambda_security_api.invoke_arn }
    "POST /api/v1/access-requests/{proxy+}" = { method = "POST", lambda_arn = module.lambda_security_api.function_arn, lambda_invoke_arn = module.lambda_security_api.invoke_arn }

    # Core API
    "GET /api/v1/health"       = { method = "GET", lambda_arn = module.lambda_core_api.function_arn, lambda_invoke_arn = module.lambda_core_api.invoke_arn, authorizer = false }
    "ANY /api/v1/core/{proxy+}" = { method = "ANY", lambda_arn = module.lambda_core_api.function_arn, lambda_invoke_arn = module.lambda_core_api.invoke_arn }

    # Orchestrator
    "POST /api/v1/orchestrate/{proxy+}" = { method = "POST", lambda_arn = module.lambda_orchestrator.function_arn, lambda_invoke_arn = module.lambda_orchestrator.invoke_arn }

    # Slack
    "POST /api/v1/slack/{proxy+}" = { method = "POST", lambda_arn = module.lambda_slack_handler.function_arn, lambda_invoke_arn = module.lambda_slack_handler.invoke_arn, authorizer = false }

    # GitHub Proxy
    "ANY /api/v1/github/{proxy+}" = { method = "ANY", lambda_arn = module.lambda_github_proxy.function_arn, lambda_invoke_arn = module.lambda_github_proxy.invoke_arn }
  }
}

# ---------------------------------------------------------------------------
# WebSocket Connections Table (defined here to avoid circular dependency
# between ws-* Lambdas and the websocket module)
# ---------------------------------------------------------------------------

resource "aws_dynamodb_table" "ws_connections" {
  name         = "atlasit-ws-connections-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  attribute {
    name = "tenantId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "tenantIndex"
    hash_key        = "tenantId"
    projection_type = "ALL"
  }

  tags = {
    Name = "atlasit-ws-connections-${var.env}"
  }
}

# ---------------------------------------------------------------------------
# WebSocket Lambda Functions
# ---------------------------------------------------------------------------

module "lambda_ws_connect" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "ws-connect"
  source_dir         = "${path.module}/../../../../lambdas/ws-connect/dist"
  memory_size        = 128
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = aws_dynamodb_table.ws_connections.arn
  enable_dynamodb    = true
  environment_variables = {
    CONNECTIONS_TABLE = aws_dynamodb_table.ws_connections.name
    NODE_OPTIONS      = "--enable-source-maps"
  }
}

module "lambda_ws_disconnect" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "ws-disconnect"
  source_dir         = "${path.module}/../../../../lambdas/ws-disconnect/dist"
  memory_size        = 128
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = aws_dynamodb_table.ws_connections.arn
  enable_dynamodb    = true
  environment_variables = {
    CONNECTIONS_TABLE = aws_dynamodb_table.ws_connections.name
    NODE_OPTIONS      = "--enable-source-maps"
  }
}

module "lambda_ws_broadcast" {
  source             = "../../modules/lambda"
  env                = var.env
  function_name      = "ws-broadcast"
  source_dir         = "${path.module}/../../../../lambdas/ws-broadcast/dist"
  memory_size        = 128
  layer_arns         = [module.lambda_layer.layer_arn]
  dynamodb_table_arn = aws_dynamodb_table.ws_connections.arn
  enable_dynamodb    = true
  environment_variables = {
    CONNECTIONS_TABLE = aws_dynamodb_table.ws_connections.name
    NODE_OPTIONS      = "--enable-source-maps"
  }
}

# ---------------------------------------------------------------------------
# WebSocket API Gateway
# ---------------------------------------------------------------------------

module "websocket" {
  source                       = "../../modules/websocket"
  env                          = var.env
  connect_lambda_arn           = module.lambda_ws_connect.function_arn
  connect_lambda_invoke_arn    = module.lambda_ws_connect.invoke_arn
  disconnect_lambda_arn        = module.lambda_ws_disconnect.function_arn
  disconnect_lambda_invoke_arn = module.lambda_ws_disconnect.invoke_arn
  dynamodb_table_arn           = module.dynamodb.table_arn
}
