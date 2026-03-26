resource "aws_secretsmanager_secret" "this" {
  name                    = var.secretsmanager_secret_name
  description             = var.secretsmanager_description
  recovery_window_in_days = var.secretsmanager_recovery_window_in_days
  kms_key_id              = var.secret_encryption_use_custom_kms_key ? aws_kms_key.custom_secret_kms_key[0].key_id : null
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "this" {
  secret_id      = aws_secretsmanager_secret.this.id
  secret_string  = var.secretsmanager_secret_string
  version_stages = var.secretsmanager_version_stages
}


data "aws_iam_policy_document" "this" {
  statement {
    effect = "Allow"
    principals {
      type        = var.policy_principal_types
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions = var.policy_actions
    resources = [
      aws_secretsmanager_secret.this.arn,
      "${aws_secretsmanager_secret.this.arn}/*",
    ]
  }
}

resource "aws_secretsmanager_secret_policy" "this" {
  secret_arn = aws_secretsmanager_secret.this.arn
  policy     = data.aws_iam_policy_document.this.json
}


resource "aws_secretsmanager_secret_rotation" "this" {
  # create this resource only if var.rotation_lambda_arn is not empty
  count = var.secretsmanager_rotation_lambda_arn != null ? 1 : 0

  secret_id           = aws_secretsmanager_secret.this.id
  rotation_lambda_arn = var.secretsmanager_rotation_lambda_arn

  rotation_rules {
    automatically_after_days = var.secretsmanager_automatically_after_days
  }
}


data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "custom_secret_kms_key_policy" {
  statement {
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:CreateGrant",
      "kms:DescribeKey"
    ]
    effect    = "Allow"
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["secretsmanager.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["secretsmanager.${var.region}.amazonaws.com"]
    }
  }
  statement {
    actions = [
      "kms:*",
    ]
    effect    = "Allow"
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }
}

resource "aws_kms_key" "custom_secret_kms_key" {
  count               = var.secret_encryption_use_custom_kms_key ? 1 : 0
  description         = "Custom KMS key for Secret Manager secret encryption"
  enable_key_rotation = true
}

resource "aws_kms_alias" "a" {
  count         = var.secret_encryption_use_custom_kms_key ? 1 : 0
  name          = "alias/secretsmanager-${aws_secretsmanager_secret.this.name}"
  target_key_id = aws_kms_key.custom_secret_kms_key[0].key_id
}

resource "aws_kms_key_policy" "custom_secret_key_policy" {
  count  = var.secret_encryption_use_custom_kms_key ? 1 : 0
  key_id = aws_kms_key.custom_secret_kms_key[0].id
  policy = data.aws_iam_policy_document.custom_secret_kms_key_policy.json
}


