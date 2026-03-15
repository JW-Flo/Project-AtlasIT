resource "aws_sns_topic" "alarms" {
  name = "atlasit-alarms-${var.env}"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Lambda error rate > 5%
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each            = toset(var.lambda_function_names)
  alarm_name          = "atlasit-${each.value}-errors-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5
  alarm_description   = "Lambda ${each.value} error rate > 5%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "(errors / invocations) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = "atlasit-${each.value}-${var.env}"
      }
    }
  }

  metric_query {
    id = "invocations"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = "atlasit-${each.value}-${var.env}"
      }
    }
  }
}

# DLQ messages > 0
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  for_each            = var.dlq_arns
  alarm_name          = "atlasit-dlq-${each.key}-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  period              = 300
  threshold           = 0
  statistic           = "Sum"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  alarm_description   = "DLQ ${each.key} has unprocessed messages"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = "atlasit-${each.key}-dlq-${var.env}"
  }
}

# API Gateway 5xx > 1%
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  count               = var.enable_api_gateway_alarms ? 1 : 0
  alarm_name          = "atlasit-api-5xx-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 1
  alarm_description   = "API Gateway 5xx rate > 1%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "(errors_5xx / total) * 100"
    label       = "5xx Rate"
    return_data = true
  }

  metric_query {
    id = "errors_5xx"
    metric {
      metric_name = "5xx"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiId = var.api_gateway_id
      }
    }
  }

  metric_query {
    id = "total"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiId = var.api_gateway_id
      }
    }
  }
}

# Billing alarm
resource "aws_cloudwatch_metric_alarm" "billing" {
  alarm_name          = "atlasit-billing-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  period              = 21600
  threshold           = 10
  statistic           = "Maximum"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  alarm_description   = "Estimated charges exceed $10"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    Currency = "USD"
  }
}
