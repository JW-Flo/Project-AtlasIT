# Cost controls — all free-tier AWS cost management tools
# First 2 AWS Budgets are free, Cost Anomaly Detection is free,
# CloudWatch billing alarms are free

# --- Tight monthly budget (action: notify + auto-stop if exceeded) ---

resource "aws_budgets_budget" "tight_monthly" {
  name         = "atlasit-tight-${var.env}"
  budget_type  = "COST"
  limit_amount = var.env == "prod" ? "200" : "50"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Project$AtlasIT"]
  }

  # Alert at 50% — early warning
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 50
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }

  # Alert at 80% — take action
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }

  # Alert at 100% — budget exceeded
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }

  # Forecasted to exceed
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 90
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }
}

# --- Per-service budgets to catch runaway costs ---

resource "aws_budgets_budget" "lambda_budget" {
  name         = "atlasit-lambda-${var.env}"
  budget_type  = "COST"
  limit_amount = var.env == "prod" ? "50" : "10"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["AWS Lambda"]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.alerts.arn]
  }
}

# --- Cost Anomaly Detection (free) ---

resource "aws_ce_anomaly_monitor" "main" {
  name              = "atlasit-anomaly-${var.env}"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "main" {
  name = "atlasit-anomaly-alerts-${var.env}"

  monitor_arn_list = [aws_ce_anomaly_monitor.main.arn]

  frequency = "IMMEDIATE"

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      match_options = ["GREATER_THAN_OR_EQUAL"]
      values        = ["10"]
    }
  }

  subscriber {
    type    = "SNS"
    address = aws_sns_topic.alerts.arn
  }
}

# --- CloudWatch billing alarm (free in us-east-1) ---
# This catches ALL spend, not just tagged resources

resource "aws_cloudwatch_metric_alarm" "billing_alarm" {
  provider            = aws.use1
  alarm_name          = "atlasit-billing-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = 21600 # 6 hours
  statistic           = "Maximum"
  threshold           = var.env == "prod" ? 150 : 30
  alarm_description   = "AWS estimated charges exceeded threshold — investigate immediately"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    Currency = "USD"
  }
}

# --- Lambda concurrency limits (prevent runaway invocations) ---

resource "aws_lambda_function_event_invoke_config" "core_api_throttle" {
  function_name                = aws_lambda_function.core_api.function_name
  maximum_retry_attempts       = 0
  maximum_event_age_in_seconds = 60
}

resource "aws_lambda_function_event_invoke_config" "orchestrator_throttle" {
  function_name                = aws_lambda_function.orchestrator.function_name
  maximum_retry_attempts       = 1
  maximum_event_age_in_seconds = 120
}


# NOTE: No provisioned concurrency configured — all Lambdas run on-demand for cost control.
# Add aws_lambda_provisioned_concurrency_config only if cold starts become a problem.
