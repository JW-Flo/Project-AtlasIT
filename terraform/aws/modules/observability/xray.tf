resource "aws_xray_sampling_rule" "atlasit" {
  rule_name      = "atlasit-${var.env}"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.05
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "atlasit-*"
  resource_arn   = "*"
}
