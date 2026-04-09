# Observability — CloudWatch log groups, alarms, and dashboards

# Log groups for each Lambda function
resource "aws_cloudwatch_log_group" "hybrid" {
  name              = "/atlasit/${var.env}/hybrid"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda_core_api" {
  name              = "/aws/lambda/atlasit-core-api-${var.env}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda_compliance" {
  name              = "/aws/lambda/atlasit-compliance-api-${var.env}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda_orchestrator" {
  name              = "/aws/lambda/atlasit-orchestrator-${var.env}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda_onboarding" {
  name              = "/aws/lambda/atlasit-onboarding-api-${var.env}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda_scheduler" {
  name              = "/aws/lambda/atlasit-scheduler-${var.env}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda_slack" {
  name              = "/aws/lambda/atlasit-slack-handler-${var.env}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda_dlq" {
  name              = "/aws/lambda/atlasit-dlq-processor-${var.env}"
  retention_in_days = 30
}

# --- Alarms ---

# API 5xx error rate
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "atlasit-api-5xx-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway 5xx errors exceeded threshold"

  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }
}

# Lambda errors (core API)
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "atlasit-lambda-errors-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Core API Lambda errors exceeded threshold"

  dimensions = {
    FunctionName = aws_lambda_function.core_api.function_name
  }
}

# Lambda duration (p95 approaching timeout)
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "atlasit-lambda-duration-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 25000 # 25s (timeout is 30s)
  alarm_description   = "Core API Lambda p95 duration approaching timeout"

  dimensions = {
    FunctionName = aws_lambda_function.core_api.function_name
  }
}
