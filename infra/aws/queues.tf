# SQS queues — replaces Cloudflare Queues (atlasit-step-tasks)

resource "aws_sqs_queue" "step_tasks" {
  name                       = "atlasit-step-tasks-${var.env}"
  visibility_timeout_seconds = 120
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 10      # long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.step_tasks_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "step_tasks_dlq" {
  name                       = "atlasit-step-tasks-dlq-${var.env}"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 120
}

# CloudWatch alarm on DLQ depth
resource "aws_cloudwatch_metric_alarm" "dlq_depth" {
  alarm_name          = "atlasit-dlq-depth-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Dead letter queue has messages — investigate failed step tasks"
  alarm_actions       = []

  dimensions = {
    QueueName = aws_sqs_queue.step_tasks_dlq.name
  }
}
