# EventBridge Scheduler — replaces Cloudflare cron triggers

# Compliance scoring: every 5 minutes (was cron */5 * * * *)
resource "aws_scheduler_schedule" "compliance_scoring" {
  name       = "atlasit-compliance-scoring-${var.env}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(5 minutes)"

  target {
    arn      = aws_lambda_function.compliance_api.arn
    role_arn = aws_iam_role.scheduler_exec.arn

    input = jsonencode({
      source = "scheduler"
      action = "compliance-scoring"
    })
  }
}

# Daily full re-evaluation at 02:00 UTC
resource "aws_scheduler_schedule" "daily_evaluation" {
  name       = "atlasit-daily-evaluation-${var.env}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 2 * * ? *)"

  target {
    arn      = aws_lambda_function.compliance_api.arn
    role_arn = aws_iam_role.scheduler_exec.arn

    input = jsonencode({
      source = "scheduler"
      action = "daily-full-evaluation"
    })
  }
}

# Orchestrator periodic tasks (was multiple cron triggers)
resource "aws_scheduler_schedule" "orchestrator_dispatch" {
  name       = "atlasit-orchestrator-dispatch-${var.env}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(15 minutes)"

  target {
    arn      = aws_lambda_function.orchestrator.arn
    role_arn = aws_iam_role.scheduler_exec.arn

    input = jsonencode({
      source = "scheduler"
      action = "dispatch-tasks"
    })
  }
}

# Lambda warmup to prevent cold starts on critical paths (F-14)
# Invokes each Lambda every 5 minutes with noop payload to keep instances warm
resource "aws_scheduler_schedule" "lambda_warmup_core" {
  name       = "atlasit-warmup-core-${var.env}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(5 minutes)"

  target {
    arn      = aws_lambda_function.core_api.arn
    role_arn = aws_iam_role.scheduler_exec.arn

    input = jsonencode({
      source  = "warmup"
      action  = "keepalive"
      version = "2024"
    })
  }
}

resource "aws_scheduler_schedule" "lambda_warmup_compliance" {
  name       = "atlasit-warmup-compliance-${var.env}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(5 minutes)"

  target {
    arn      = aws_lambda_function.compliance_api.arn
    role_arn = aws_iam_role.scheduler_exec.arn

    input = jsonencode({
      source  = "warmup"
      action  = "keepalive"
      version = "2024"
    })
  }
}

resource "aws_scheduler_schedule" "lambda_warmup_onboarding" {
  name       = "atlasit-warmup-onboarding-${var.env}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(5 minutes)"

  target {
    arn      = aws_lambda_function.onboarding_api.arn
    role_arn = aws_iam_role.scheduler_exec.arn

    input = jsonencode({
      source  = "warmup"
      action  = "keepalive"
      version = "2024"
    })
  }
}

# Scheduler execution role
resource "aws_iam_role" "scheduler_exec" {
  name = "atlasit-scheduler-exec-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "scheduler_invoke" {
  name = "atlasit-scheduler-invoke-${var.env}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["lambda:InvokeFunction"]
      Resource = [
        aws_lambda_function.compliance_api.arn,
        aws_lambda_function.orchestrator.arn,
        aws_lambda_function.scheduler.arn,
        aws_lambda_function.core_api.arn,
        aws_lambda_function.onboarding_api.arn,
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "scheduler_invoke" {
  role       = aws_iam_role.scheduler_exec.name
  policy_arn = aws_iam_policy.scheduler_invoke.arn
}
