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

# Log groups for adapter Lambdas — auto-created by AWS on first invocation with
# null retention (cost bomb). Explicitly manage + set 30d retention.
resource "aws_cloudwatch_log_group" "lambda_adapter" {
  for_each          = local.core_adapters
  name              = "/aws/lambda/atlasit-adapter-${each.key}-${var.env}"
  retention_in_days = 30
}

# Import pre-existing auto-created log groups so Terraform picks them up
# without erroring on "already exists". (for_each in import blocks requires
# Terraform >=1.7; this repo is pinned to ~>1.5, so use individual imports.)
import {
  to = aws_cloudwatch_log_group.lambda_adapter["okta"]
  id = "/aws/lambda/atlasit-adapter-okta-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["google-workspace"]
  id = "/aws/lambda/atlasit-adapter-google-workspace-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["microsoft-365"]
  id = "/aws/lambda/atlasit-adapter-microsoft-365-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["slack"]
  id = "/aws/lambda/atlasit-adapter-slack-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["github"]
  id = "/aws/lambda/atlasit-adapter-github-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["jira"]
  id = "/aws/lambda/atlasit-adapter-jira-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["stripe"]
  id = "/aws/lambda/atlasit-adapter-stripe-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["aws"]
  id = "/aws/lambda/atlasit-adapter-aws-${var.env}"
}
import {
  to = aws_cloudwatch_log_group.lambda_adapter["azure"]
  id = "/aws/lambda/atlasit-adapter-azure-${var.env}"
}

# Alarms with SNS actions are in alarms.tf — no duplicates here
