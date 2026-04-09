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

# Alarms with SNS actions are in alarms.tf — no duplicates here
