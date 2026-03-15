resource "aws_ssm_parameter" "secret" {
  for_each = { for k, v in var.secrets : k => v if v != "" }

  name  = "/atlasit/${var.env}/${each.key}"
  type  = "SecureString"
  value = each.value

  lifecycle {
    ignore_changes = [value]
  }
}
