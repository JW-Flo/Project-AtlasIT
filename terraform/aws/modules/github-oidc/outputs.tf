output "oidc_provider_arn" {
  value       = aws_iam_openid_connect_provider.github.arn
  description = "ARN of the GitHub Actions OIDC provider"
}

output "deploy_role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "ARN of the GitHub Actions deploy role"
}

output "deploy_role_name" {
  value       = aws_iam_role.github_actions.name
  description = "Name of the GitHub Actions deploy role"
}
