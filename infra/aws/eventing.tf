resource "aws_cloudwatch_event_bus" "atlasit" {
  name = "atlasit-${var.env}"
}

resource "aws_iam_policy" "eventbridge_put" {
  name        = "atlasit-eb-put-${var.env}"
  description = "Allow PutEvents to the AtlasIT event bus"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid      = "PutEvents",
      Effect   = "Allow",
      Action   = ["events:PutEvents"],
      Resource = aws_cloudwatch_event_bus.atlasit.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach_event_put" {
  role       = aws_iam_role.atlasit_hybrid_role.name
  policy_arn = aws_iam_policy.eventbridge_put.arn
}
