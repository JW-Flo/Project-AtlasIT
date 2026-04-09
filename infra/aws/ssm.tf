# SSM Parameter Store — service discovery for CI/CD and Lambda runtime

resource "aws_ssm_parameter" "console_bucket" {
  name  = "/atlasit/${var.env}/console-bucket"
  type      = "String"
  overwrite = true
  value = aws_s3_bucket.console.bucket
}

resource "aws_ssm_parameter" "cloudfront_distribution_id" {
  name  = "/atlasit/${var.env}/cloudfront-distribution-id"
  type      = "String"
  overwrite = true
  value = aws_cloudfront_distribution.main.id
}

resource "aws_ssm_parameter" "api_gateway_url" {
  name  = "/atlasit/${var.env}/api-gateway-url"
  type      = "String"
  overwrite = true
  value = aws_apigatewayv2_api.main.api_endpoint
}

resource "aws_ssm_parameter" "aurora_endpoint" {
  name  = "/atlasit/${var.env}/aurora-endpoint"
  type      = "String"
  overwrite = true
  value = aws_rds_cluster.main.endpoint
}

resource "aws_ssm_parameter" "evidence_bucket" {
  name  = "/atlasit/${var.env}/evidence-bucket"
  type      = "String"
  overwrite = true
  value = aws_s3_bucket.evidence.bucket
}

resource "aws_ssm_parameter" "sqs_step_tasks_url" {
  name  = "/atlasit/${var.env}/sqs-step-tasks-url"
  type      = "String"
  overwrite = true
  value = aws_sqs_queue.step_tasks.url
}

resource "aws_ssm_parameter" "event_bus_name" {
  name  = "/atlasit/${var.env}/event-bus-name"
  type      = "String"
  overwrite = true
  value = aws_cloudwatch_event_bus.atlasit.name
}

resource "aws_ssm_parameter" "jml_workflow_arn" {
  name  = "/atlasit/${var.env}/jml-workflow-arn"
  type      = "String"
  overwrite = true
  value = aws_sfn_state_machine.jml_workflow.arn
}

resource "aws_ssm_parameter" "automation_rule_arn" {
  name  = "/atlasit/${var.env}/automation-rule-arn"
  type      = "String"
  overwrite = true
  value = aws_sfn_state_machine.automation_rule.arn
}
