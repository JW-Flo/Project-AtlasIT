# --- IAM Role for Step Functions ---

data "aws_iam_policy_document" "sfn_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "sfn" {
  name               = "atlasit-sfn-jml-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.sfn_assume.json
}

data "aws_iam_policy_document" "sfn_policy" {
  statement {
    sid       = "InvokeLambda"
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = [var.workflow_executor_lambda_arn]
  }

  statement {
    sid       = "SendToDLQ"
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [var.dlq_arn]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:CreateLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "XRayTracing"
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "sfn" {
  name   = "atlasit-sfn-jml-policy-${var.env}"
  role   = aws_iam_role.sfn.id
  policy = data.aws_iam_policy_document.sfn_policy.json
}

# --- CloudWatch Log Group ---

resource "aws_cloudwatch_log_group" "sfn" {
  name              = "/aws/states/atlasit-jml-${var.env}"
  retention_in_days = 14
}

# --- Step Functions State Machine ---

resource "aws_sfn_state_machine" "jml_workflow" {
  name     = "atlasit-jml-workflow-${var.env}"
  role_arn = aws_iam_role.sfn.arn
  type     = "STANDARD"

  definition = jsonencode({
    Comment = "JML Workflow - Joiner/Mover/Leaver lifecycle"
    StartAt = "ValidateInput"
    States = {
      ValidateInput = {
        Type = "Pass"
        Next = "ExecuteSteps"
      }
      ExecuteSteps = {
        Type           = "Map"
        ItemsPath      = "$.steps"
        MaxConcurrency = 1
        Iterator = {
          StartAt = "ExecuteStep"
          States = {
            ExecuteStep = {
              Type     = "Task"
              Resource = var.workflow_executor_lambda_arn
              Retry = [
                {
                  ErrorEquals    = ["States.TaskFailed", "Lambda.ServiceException"]
                  IntervalSeconds = 5
                  MaxAttempts    = 3
                  BackoffRate    = 2.0
                }
              ]
              Catch = [
                {
                  ErrorEquals = ["States.ALL"]
                  Next        = "StepFailed"
                }
              ]
              End = true
            }
            StepFailed = {
              Type     = "Task"
              Resource = "arn:aws:states:::sqs:sendMessage"
              Parameters = {
                "QueueUrl.$"    = "$.dlqUrl"
                "MessageBody" = {
                  "error.$"  = "$.error"
                  "cause.$"  = "$.cause"
                  "stepId.$" = "$.stepId"
                }
              }
              End = true
            }
          }
        }
        Next = "WorkflowComplete"
      }
      WorkflowComplete = {
        Type = "Succeed"
      }
    }
  })

  tracing_configuration {
    enabled = true
  }

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.sfn.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }
}
