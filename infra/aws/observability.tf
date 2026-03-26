# Placeholder observability resources; extend as needed

resource "aws_cloudwatch_log_group" "hybrid" {
  name              = "/atlasit/${var.env}/hybrid"
  retention_in_days = 30
}
