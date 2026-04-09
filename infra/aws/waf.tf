# AWS WAF WebACL — slimmed to 2 rules ($7/mo vs $11)
# Kept: IP reputation (free managed rule) + API rate limiting (brute-force protection)
# Removed: common ruleset, known-bad-inputs, global rate limit (handled by app layer + API GW throttling)

resource "aws_wafv2_web_acl" "edge" {
  provider = aws.use1
  name     = "atlasit-edge-${var.env}"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # IP reputation list — blocks known botnets/malware sources (free managed rule)
  rule {
    name     = "aws-managed-ip-reputation"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "awsManagedIpReputation"
      sampled_requests_enabled   = true
    }
  }

  # API rate limiting — 500 req/IP/5min on /api/* (brute-force protection)
  rule {
    name     = "rate-limit-api"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 500
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string         = "/api/"
            positional_constraint = "STARTS_WITH"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rateLimitApi"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "atlasitEdgeWebACL"
    sampled_requests_enabled   = true
  }
}
