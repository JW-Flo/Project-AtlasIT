# AWS WAF WebACL for CloudFront (must be CLOUDFRONT scope)

resource "aws_wafv2_web_acl" "edge" {
  provider = aws.use1
  name     = "atlasit-edge-${var.env}"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS managed common rule set (XSS, SQLi, etc.)
  rule {
    name     = "aws-managed-common"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "awsManagedCommon"
      sampled_requests_enabled   = true
    }
  }

  # Known bad inputs
  rule {
    name     = "aws-managed-known-bad-inputs"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "awsManagedKnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # IP reputation list
  rule {
    name     = "aws-managed-ip-reputation"
    priority = 3

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

  # Global rate limiting (per IP)
  rule {
    name     = "rate-limit-global"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rateLimitGlobal"
      sampled_requests_enabled   = true
    }
  }

  # Stricter rate limit on API endpoints
  rule {
    name     = "rate-limit-api"
    priority = 11

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
