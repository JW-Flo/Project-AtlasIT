# --- Scheduler rule (every 15 minutes) ---

resource "aws_cloudwatch_event_rule" "scheduler_15min" {
  name                = "atlasit-scheduler-15min-${var.env}"
  description         = "Trigger scheduler Lambda every 15 minutes"
  schedule_expression = "rate(15 minutes)"
}

resource "aws_cloudwatch_event_target" "scheduler" {
  rule = aws_cloudwatch_event_rule.scheduler_15min.name
  arn  = var.scheduler_lambda_arn
}

resource "aws_lambda_permission" "allow_eventbridge_scheduler" {
  statement_id  = "AllowEventBridgeScheduler"
  action        = "lambda:InvokeFunction"
  function_name = var.scheduler_lambda_arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.scheduler_15min.arn
}

# --- ETL daily rule (optional) ---

resource "aws_cloudwatch_event_rule" "etl_daily" {
  count = var.etl_lambda_arn != "" ? 1 : 0

  name                = "atlasit-etl-daily-${var.env}"
  description         = "Trigger ETL Lambda daily at 02:00 UTC"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "etl" {
  count = var.etl_lambda_arn != "" ? 1 : 0

  rule = aws_cloudwatch_event_rule.etl_daily[0].name
  arn  = var.etl_lambda_arn
}

resource "aws_lambda_permission" "allow_eventbridge_etl" {
  count = var.etl_lambda_arn != "" ? 1 : 0

  statement_id  = "AllowEventBridgeETL"
  action        = "lambda:InvokeFunction"
  function_name = var.etl_lambda_arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.etl_daily[0].arn
}

# --- Event archive ---

resource "aws_cloudwatch_event_archive" "main" {
  name             = "atlasit-archive-${var.env}"
  event_source_arn = var.event_bus_arn
  retention_days   = 30
}
