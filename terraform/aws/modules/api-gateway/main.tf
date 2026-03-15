data "aws_region" "current" {}

# Cognito user pool client ID for JWT audience
data "aws_cognito_user_pool_clients" "main" {
  user_pool_id = regex("([^/]+)$", var.cognito_user_pool_arn)[0]
}

resource "aws_apigatewayv2_api" "main" {
  name          = "atlasit-${var.env}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Request-Id"]
    max_age       = 3600
  }
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/atlasit-${var.env}"
  retention_in_days = 14
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-${var.env}"

  jwt_configuration {
    audience = data.aws_cognito_user_pool_clients.main.client_ids
    issuer   = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${regex("([^/]+)$", var.cognito_user_pool_arn)[0]}"
  }
}

# Routes
resource "aws_apigatewayv2_integration" "routes" {
  for_each = var.routes

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value.lambda_invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = var.routes

  api_id    = aws_apigatewayv2_api.main.id
  route_key = each.key

  target             = "integrations/${aws_apigatewayv2_integration.routes[each.key].id}"
  authorization_type = each.value.authorizer ? "JWT" : "NONE"
  authorizer_id      = each.value.authorizer ? aws_apigatewayv2_authorizer.cognito.id : null
}

# Lambda permissions managed via CLI to avoid Terraform hanging issues
# See: aws lambda add-permission --statement-id AllowAPIGateway ...
