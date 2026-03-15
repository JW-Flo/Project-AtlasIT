resource "aws_sqs_queue" "dlq" {
  for_each = toset(var.queues)

  name                      = "atlasit-${each.key}-dlq-${var.env}"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "main" {
  for_each = toset(var.queues)

  name                       = "atlasit-${each.key}-${var.env}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 3
  })
}
