output "queue_urls" {
  value = { for q in var.queues : q => aws_sqs_queue.main[q].url }
}

output "queue_arns" {
  value = { for q in var.queues : q => aws_sqs_queue.main[q].arn }
}

output "dlq_arns" {
  value = { for q in var.queues : q => aws_sqs_queue.dlq[q].arn }
}
