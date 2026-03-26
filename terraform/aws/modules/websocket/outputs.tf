output "ws_api_id" { value = aws_apigatewayv2_api.websocket.id }
output "ws_endpoint" { value = aws_apigatewayv2_stage.ws.invoke_url }
