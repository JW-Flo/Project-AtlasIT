resource "aws_cloudwatch_event_rule" "schedule" {
  name                = var.rule_name
  description         = var.description
  schedule_expression = var.schedule_expression
  tags                = var.tags
}




