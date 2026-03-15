# ---------------------------------------------------------------------------
# WebSocket API Gateway
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "atlasit-ws-${var.env}"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# ---------------------------------------------------------------------------
# CloudWatch Logs
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "ws" {
  name              = "/aws/apigateway/atlasit-ws-${var.env}"
  retention_in_days = 14
}

# ---------------------------------------------------------------------------
# Stage
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_stage" "ws" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = "production"
  auto_deploy = true

  # Access logging requires API Gateway account-level CloudWatch role
  # Enable after setting up aws_api_gateway_account with cloudwatch_role_arn
}

# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_integration" "connect" {
  api_id             = aws_apigatewayv2_api.websocket.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.connect_lambda_invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id             = aws_apigatewayv2_api.websocket.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.disconnect_lambda_invoke_arn
  integration_method = "POST"
}

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_route" "connect" {
  api_id             = aws_apigatewayv2_api.websocket.id
  route_key          = "$connect"
  target             = "integrations/${aws_apigatewayv2_integration.connect.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

# ---------------------------------------------------------------------------
# Lambda Permissions
# ---------------------------------------------------------------------------

resource "aws_lambda_permission" "ws_connect" {
  statement_id  = "AllowAPIGatewayWebSocket"
  action        = "lambda:InvokeFunction"
  function_name = var.connect_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "ws_disconnect" {
  statement_id  = "AllowAPIGatewayWebSocket"
  action        = "lambda:InvokeFunction"
  function_name = var.disconnect_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

