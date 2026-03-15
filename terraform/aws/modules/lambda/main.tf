data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/../../.build/${var.function_name}-${var.env}.zip"
}

resource "aws_lambda_function" "this" {
  function_name    = "atlasit-${var.function_name}-${var.env}"
  handler          = var.handler
  runtime          = var.runtime
  memory_size      = var.memory_size
  timeout          = var.timeout
  role             = aws_iam_role.lambda.arn
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  layers           = var.layer_arns

  environment {
    variables = var.environment_variables
  }

  tracing_config {
    mode = "Active"
  }
}
