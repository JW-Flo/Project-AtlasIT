# Step Functions — replaces Cloudflare Durable Objects (WorkflowDO, AutomationDO)
# Provides durable workflow execution with per-step timeouts, compensation, and DLQ

# --- JML Workflow State Machine ---
# Handles joiner/mover/leaver workflows with retry + compensation

resource "aws_sfn_state_machine" "jml_workflow" {
  name     = "atlasit-jml-workflow-${var.env}"
  role_arn = aws_iam_role.sfn_exec.arn

  definition = jsonencode({
    Comment = "AtlasIT JML (Joiner/Mover/Leaver) workflow"
    StartAt = "ClassifyChange"
    States = {
      ClassifyChange = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "classify"
          "payload.$" = "$"
        }
        ResultPath = "$.classification"
        Next       = "RouteByType"
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 5
          MaxAttempts     = 2
          BackoffRate     = 2.0
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
          ResultPath  = "$.error"
        }]
      }

      RouteByType = {
        Type = "Choice"
        Choices = [
          {
            Variable     = "$.classification.jmlAction"
            StringEquals = "joiner"
            Next         = "ProvisionApps"
          },
          {
            Variable     = "$.classification.jmlAction"
            StringEquals = "leaver"
            Next         = "CheckGracePeriod"
          },
          {
            Variable     = "$.classification.jmlAction"
            StringEquals = "mover"
            Next         = "UpdateEntitlements"
          }
        ]
        Default = "RecordNoAction"
      }

      ProvisionApps = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "provision"
          "payload.$" = "$"
        }
        ResultPath  = "$.provisionResult"
        TimeoutSeconds = 300
        Next        = "EmitEvidence"
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 10
          MaxAttempts     = 3
          BackoffRate     = 2.0
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "CompensateProvisioning"
          ResultPath  = "$.error"
        }]
      }

      CheckGracePeriod = {
        Type = "Choice"
        Choices = [{
          Variable              = "$.classification.leaverGraceMs"
          NumericGreaterThan    = 0
          Next                  = "WaitGracePeriod"
        }]
        Default = "RevokeAccess"
      }

      WaitGracePeriod = {
        Type         = "Wait"
        TimestampPath = "$.classification.revokeAfter"
        Next         = "RevokeAccess"
      }

      RevokeAccess = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "revoke"
          "payload.$" = "$"
        }
        ResultPath     = "$.revokeResult"
        TimeoutSeconds = 300
        Next           = "EmitEvidence"
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 10
          MaxAttempts     = 3
          BackoffRate     = 2.0
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
          ResultPath  = "$.error"
        }]
      }

      UpdateEntitlements = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "update-entitlements"
          "payload.$" = "$"
        }
        ResultPath     = "$.updateResult"
        TimeoutSeconds = 300
        Next           = "EmitEvidence"
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 10
          MaxAttempts     = 3
          BackoffRate     = 2.0
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "CompensateProvisioning"
          ResultPath  = "$.error"
        }]
      }

      EmitEvidence = {
        Type     = "Task"
        Resource = aws_lambda_function.compliance_api.arn
        Parameters = {
          "action"    = "emit-evidence"
          "payload.$" = "$"
        }
        ResultPath = "$.evidenceResult"
        Next       = "NotifyStakeholders"
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 5
          MaxAttempts     = 2
          BackoffRate     = 2.0
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "RecordWorkflowComplete"
          ResultPath  = "$.evidenceError"
        }]
      }

      NotifyStakeholders = {
        Type     = "Task"
        Resource = aws_lambda_function.slack_handler.arn
        Parameters = {
          "action"    = "notify"
          "payload.$" = "$"
        }
        ResultPath = "$.notifyResult"
        Next       = "RecordWorkflowComplete"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "RecordWorkflowComplete"
          ResultPath  = "$.notifyError"
        }]
      }

      CompensateProvisioning = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "compensate"
          "payload.$" = "$"
        }
        ResultPath = "$.compensationResult"
        Next       = "HandleError"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "EscalateToDLQ"
          ResultPath  = "$.compensationError"
        }]
      }

      EscalateToDLQ = {
        Type     = "Task"
        Resource = "arn:aws:states:::sqs:sendMessage"
        Parameters = {
          "QueueUrl"    = aws_sqs_queue.step_tasks_dlq.url
          "MessageBody.$" = "States.JsonToString($)"
        }
        Next = "WorkflowFailed"
      }

      HandleError = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "record-error"
          "payload.$" = "$"
        }
        Next = "WorkflowFailed"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "WorkflowFailed"
        }]
      }

      RecordNoAction = {
        Type   = "Pass"
        Result = { "status" = "no_action" }
        End    = true
      }

      RecordWorkflowComplete = {
        Type   = "Pass"
        Result = { "status" = "completed" }
        End    = true
      }

      WorkflowFailed = {
        Type  = "Fail"
        Error = "WorkflowExecutionFailed"
        Cause = "Workflow failed after retries and compensation"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.sfn.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }
}

# --- Automation Rule Execution State Machine ---

resource "aws_sfn_state_machine" "automation_rule" {
  name     = "atlasit-automation-rule-${var.env}"
  role_arn = aws_iam_role.sfn_exec.arn

  definition = jsonencode({
    Comment = "AtlasIT automation rule execution (replaces AutomationDO)"
    StartAt = "EvaluateConditions"
    States = {
      EvaluateConditions = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "evaluate-conditions"
          "payload.$" = "$"
        }
        ResultPath = "$.conditionResult"
        Next       = "CheckConditions"
      }

      CheckConditions = {
        Type = "Choice"
        Choices = [{
          Variable     = "$.conditionResult.matched"
          BooleanEquals = true
          Next         = "ExecuteActions"
        }]
        Default = "SkipRule"
      }

      ExecuteActions = {
        Type     = "Map"
        ItemsPath = "$.conditionResult.actions"
        MaxConcurrency = 3
        Iterator = {
          StartAt = "RunAction"
          States = {
            RunAction = {
              Type     = "Task"
              Resource = aws_lambda_function.orchestrator.arn
              Parameters = {
                "action"      = "run-automation-action"
                "actionDef.$" = "$"
                "tenantId.$"  = "$$.Execution.Input.tenantId"
              }
              TimeoutSeconds = 60
              End = true
              Retry = [{
                ErrorEquals     = ["States.TaskFailed"]
                IntervalSeconds = 5
                MaxAttempts     = 2
                BackoffRate     = 2.0
              }]
            }
          }
        }
        ResultPath = "$.actionResults"
        Next       = "RecordExecution"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "RecordExecution"
          ResultPath  = "$.actionErrors"
        }]
      }

      RecordExecution = {
        Type     = "Task"
        Resource = aws_lambda_function.orchestrator.arn
        Parameters = {
          "action"    = "record-automation-execution"
          "payload.$" = "$"
        }
        End = true
      }

      SkipRule = {
        Type   = "Pass"
        Result = { "status" = "conditions_not_met" }
        End    = true
      }
    }
  })
}

# --- IAM ---

resource "aws_iam_role" "sfn_exec" {
  name = "atlasit-sfn-exec-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "states.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "sfn_invoke" {
  name = "atlasit-sfn-invoke-${var.env}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["lambda:InvokeFunction"]
        Resource = [
          aws_lambda_function.orchestrator.arn,
          aws_lambda_function.compliance_api.arn,
          aws_lambda_function.slack_handler.arn,
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = [aws_sqs_queue.step_tasks_dlq.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = ["*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sfn_invoke" {
  role       = aws_iam_role.sfn_exec.name
  policy_arn = aws_iam_policy.sfn_invoke.arn
}

resource "aws_cloudwatch_log_group" "sfn" {
  name              = "/atlasit/${var.env}/step-functions"
  retention_in_days = 30
}

# --- Outputs ---

output "jml_workflow_arn" {
  value       = aws_sfn_state_machine.jml_workflow.arn
  description = "JML workflow state machine ARN"
}

output "automation_rule_arn" {
  value       = aws_sfn_state_machine.automation_rule.arn
  description = "Automation rule execution state machine ARN"
}
