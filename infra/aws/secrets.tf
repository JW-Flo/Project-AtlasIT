# Secrets Manager — replaces Wrangler secrets

resource "aws_secretsmanager_secret" "cred_encryption_key" {
  name        = "atlasit/${var.env}/cred-encryption-key"
  description = "AES-GCM encryption key for app_credentials table"
}

resource "aws_secretsmanager_secret" "groq_api_key" {
  name        = "atlasit/${var.env}/groq-api-key"
  description = "Groq API key for compliance AI scoring"
}

resource "aws_secretsmanager_secret" "webhook_secret" {
  name        = "atlasit/${var.env}/webhook-secret"
  description = "HMAC secret for webhook signature verification"
}

resource "aws_secretsmanager_secret" "slack_webhook_url" {
  name        = "atlasit/${var.env}/slack-webhook-url"
  description = "Slack incoming webhook URL for notifications"
}

resource "aws_secretsmanager_secret" "slack_signing_secret" {
  name        = "atlasit/${var.env}/slack-signing-secret"
  description = "Slack signing secret for request verification"
}

resource "aws_secretsmanager_secret" "github_app_key" {
  name        = "atlasit/${var.env}/github-app-key"
  description = "GitHub App private key for proxy worker"
}

resource "aws_secretsmanager_secret" "internal_api_key" {
  name        = "atlasit/${var.env}/internal-api-key"
  description = "Shared secret for internal service-to-service calls (x-internal-api-key header)"
}
