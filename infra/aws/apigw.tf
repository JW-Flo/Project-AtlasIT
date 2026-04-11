# API Gateway (HTTP API) — routes to Lambda functions
# Host-based routing via stage variables and Lambda integrations

resource "aws_apigatewayv2_api" "main" {
  name          = "atlasit-${var.env}"
  protocol_type = "HTTP"
  description   = "AtlasIT API Gateway (${var.env})"

  cors_configuration {
    # Note: CloudFront domain added manually via AWS CLI to avoid cycle.
    # Terraform manages the domain-based origins; CloudFront origin set via API.
    allow_origins     = ["https://${var.domain}", "https://www.${var.domain}"]
    allow_methods     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers     = ["Authorization", "Content-Type", "x-tenant-id", "x-internal-api-key", "x-request-id", "x-correlation-id", "x-api-key"]
    expose_headers    = ["x-request-id"]
    max_age           = 7200
    allow_credentials = true
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
      latency        = "$context.responseLatency"
    })
  }

  default_route_settings {
    throttling_burst_limit = 500
    throttling_rate_limit  = 1000
  }
}

# Log group for API Gateway access logs
resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/atlasit/${var.env}/apigw"
  retention_in_days = 30
}

# --- Lambda integrations ---

# Core API: /api/*
resource "aws_apigatewayv2_integration" "core_api" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.core_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "core_api" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.core_api.id}"
}

# Health endpoint
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.core_api.id}"
}

# Compliance API
resource "aws_apigatewayv2_integration" "compliance" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.compliance_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "compliance" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/compliance/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.compliance.id}"
}

# Orchestrator
resource "aws_apigatewayv2_integration" "orchestrator" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.orchestrator.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "orchestrator" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /orchestrator/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.orchestrator.id}"
}

# Onboarding API
resource "aws_apigatewayv2_integration" "onboarding" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.onboarding_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "onboarding" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/onboarding/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.onboarding.id}"
}

# Scheduler (invoked by EventBridge, not via API Gateway)
# Slack handler
resource "aws_apigatewayv2_integration" "slack" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.slack_handler.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "slack" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/slack/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.slack.id}"
}
