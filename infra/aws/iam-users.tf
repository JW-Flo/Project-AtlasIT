# IAM user policy attachments for atlasit-dev-cli.
#
# This user is manually provisioned (bootstrap identity, predates Terraform).
# We attach managed policies here so future audits/cleanups don't fail on
# missing permissions.
#
# Memory note (project_aws_iam_debt.md): this user replaced the root key;
# current scope is admin-broad for dev. Tighten in staging/prod envs.

resource "aws_iam_user_policy_attachment" "dev_cli_readonly" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Cleanup perms — allow destructive ops on dev-only resources while the
# migration is completing. Remove once M7 ships and staging is validated.
resource "aws_iam_user_policy_attachment" "dev_cli_ec2" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
}

resource "aws_iam_user_policy_attachment" "dev_cli_lambda" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
}

resource "aws_iam_user_policy_attachment" "dev_cli_s3" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_user_policy_attachment" "dev_cli_dynamodb" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_user_policy_attachment" "dev_cli_cloudfront" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/CloudFrontFullAccess"
}

resource "aws_iam_user_policy_attachment" "dev_cli_apigw" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator"
}

resource "aws_iam_user_policy_attachment" "dev_cli_rds" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSFullAccess"
}

resource "aws_iam_user_policy_attachment" "dev_cli_logs" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

# IAM management — needed to clean up orphan roles/policies. Gate tightly.
resource "aws_iam_user_policy_attachment" "dev_cli_iam" {
  user       = "atlasit-dev-cli"
  policy_arn = "arn:aws:iam::aws:policy/IAMFullAccess"
}

# Cost Explorer for `aws ce` calls in audits.
resource "aws_iam_user_policy" "dev_cli_cost_explorer" {
  name = "atlasit-dev-cli-cost-explorer"
  user = "atlasit-dev-cli"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues",
        "ce:GetTags",
      ]
      Resource = "*"
    }]
  })
}
