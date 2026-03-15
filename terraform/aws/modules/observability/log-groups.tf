resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = toset(var.lambda_function_names)
  name              = "/aws/lambda/atlasit-${each.value}-${var.env}"
  retention_in_days = 14
}
