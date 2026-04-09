# SNS topic for alarm notifications + CloudWatch dashboard

resource "aws_sns_topic" "alerts" {
  name = "atlasit-alerts-${var.env}"
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudwatch.amazonaws.com" }
      Action    = "SNS:Publish"
      Resource  = aws_sns_topic.alerts.arn
    }]
  })
}

# Wire existing alarms to SNS
resource "aws_cloudwatch_metric_alarm" "api_5xx_notify" {
  alarm_name          = "atlasit-api-5xx-notify-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway 5xx errors — check Lambda logs"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors_notify" {
  alarm_name          = "atlasit-lambda-errors-notify-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda errors across core functions"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.core_api.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "atlasit-aurora-cpu-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Aurora CPU above 80% — consider scaling ACU max"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "atlasit-aurora-connections-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 50
  alarm_description   = "Aurora connections high — check Lambda pool config"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }
}

# Budget alerts moved to cost-controls.tf (tighter limits, per-service budgets, anomaly detection)

# --- CloudWatch Dashboard ---

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "atlasit-${var.env}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway Requests & Errors"
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.main.id, { stat = "Sum", label = "Requests" }],
            ["AWS/ApiGateway", "5xx", "ApiId", aws_apigatewayv2_api.main.id, { stat = "Sum", label = "5xx Errors", color = "#d62728" }],
            ["AWS/ApiGateway", "4xx", "ApiId", aws_apigatewayv2_api.main.id, { stat = "Sum", label = "4xx Errors", color = "#ff7f0e" }],
          ]
          period = 300
          view   = "timeSeries"
          region = var.region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway Latency (p50 / p95 / p99)"
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.main.id, { stat = "p50", label = "p50" }],
            ["AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.main.id, { stat = "p95", label = "p95", color = "#ff7f0e" }],
            ["AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.main.id, { stat = "p99", label = "p99", color = "#d62728" }],
          ]
          period = 300
          view   = "timeSeries"
          region = var.region
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "Lambda Duration by Function"
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "atlasit-core-api-${var.env}", { stat = "p95", label = "core-api" }],
            ["AWS/Lambda", "Duration", "FunctionName", "atlasit-compliance-api-${var.env}", { stat = "p95", label = "compliance" }],
            ["AWS/Lambda", "Duration", "FunctionName", "atlasit-orchestrator-${var.env}", { stat = "p95", label = "orchestrator" }],
            ["AWS/Lambda", "Duration", "FunctionName", "atlasit-onboarding-api-${var.env}", { stat = "p95", label = "onboarding" }],
          ]
          period = 300
          view   = "timeSeries"
          region = var.region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "Lambda Errors by Function"
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "atlasit-core-api-${var.env}", { stat = "Sum", label = "core-api" }],
            ["AWS/Lambda", "Errors", "FunctionName", "atlasit-compliance-api-${var.env}", { stat = "Sum", label = "compliance" }],
            ["AWS/Lambda", "Errors", "FunctionName", "atlasit-orchestrator-${var.env}", { stat = "Sum", label = "orchestrator" }],
            ["AWS/Lambda", "Errors", "FunctionName", "atlasit-dlq-processor-${var.env}", { stat = "Sum", label = "dlq-processor", color = "#d62728" }],
          ]
          period = 300
          view   = "timeSeries"
          region = var.region
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title = "Aurora PostgreSQL"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", "atlasit-${var.env}", { stat = "Average", label = "CPU %" }],
            ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", "atlasit-${var.env}", { stat = "Maximum", label = "Connections" }],
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", "atlasit-${var.env}", { stat = "Average", label = "ACU" }],
          ]
          period = 300
          view   = "timeSeries"
          region = var.region
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title = "SQS Queues"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.step_tasks.name, { stat = "Maximum", label = "Step Tasks" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.step_tasks_dlq.name, { stat = "Maximum", label = "DLQ", color = "#d62728" }],
          ]
          period = 60
          view   = "timeSeries"
          region = var.region
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          title = "CloudFront"
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.main.id, "Region", "Global", { stat = "Sum", label = "Requests" }],
            ["AWS/CloudFront", "TotalErrorRate", "DistributionId", aws_cloudfront_distribution.main.id, "Region", "Global", { stat = "Average", label = "Error Rate %", color = "#d62728" }],
          ]
          period = 300
          view   = "timeSeries"
          region = "us-east-1"
        }
      },
    ]
  })
}

# --- Outputs ---

output "sns_alerts_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "SNS topic ARN for alarm notifications"
}

output "dashboard_url" {
  value       = "https://${var.region}.console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=atlasit-${var.env}"
  description = "CloudWatch dashboard URL"
}
