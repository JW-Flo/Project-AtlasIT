output "scheduler_rule_arn" {
  value = aws_cloudwatch_event_rule.scheduler_15min.arn
}
