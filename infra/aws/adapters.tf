# Lambda functions for core-tier adapters (M6)
# Each adapter runs as a Lambda behind API Gateway

locals {
  core_adapters = toset([
    "okta",
    "google-workspace",
    "microsoft-365",
    "slack",
    "github",
    "jira",
    "stripe",
    "aws",
    "azure",
  ])
}

resource "aws_lambda_function" "adapter" {
  for_each = local.core_adapters

  function_name = "atlasit-adapter-${each.key}-${var.env}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = local.lambda_defaults.runtime
  handler       = "lambda-handler.handler"
  memory_size   = 128
  timeout       = 30
  filename      = data.archive_file.placeholder.output_path

  environment {
    variables = merge(local.common_env, {
      ADAPTER_NAME   = each.key
      INTERNAL_API_KEY = "from-ssm"
    })
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, environment]
  }
}

# API Gateway integrations for adapters
resource "aws_apigatewayv2_integration" "adapter" {
  for_each = local.core_adapters

  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.adapter[each.key].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "adapter" {
  for_each = local.core_adapters

  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /adapters/${each.key}/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.adapter[each.key].id}"
}

resource "aws_lambda_permission" "adapter_apigw" {
  for_each = local.core_adapters

  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.adapter[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
