output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.main.arn
}

output "console_client_id" {
  value = aws_cognito_user_pool_client.console.id
}

output "api_client_id" {
  value = aws_cognito_user_pool_client.api.id
}

output "api_client_secret" {
  value     = aws_cognito_user_pool_client.api.client_secret
  sensitive = true
}

output "issuer_url" {
  value = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "domain" {
  value = aws_cognito_user_pool_domain.main.domain
}
