# Route 53 hosted zone and DNS records for atlasit.pro
# Import existing zone after Cloudflare DNS export

resource "aws_route53_zone" "primary" {
  name = var.domain
}

# Apex → CloudFront alias
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = var.domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Wildcard → CloudFront alias (covers api., compliance., docs., etc.)
resource "aws_route53_record" "wildcard" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "*.${var.domain}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Health check for the core API
resource "aws_route53_health_check" "api" {
  fqdn              = "api.${var.domain}"
  port               = 443
  type               = "HTTPS"
  resource_path      = "/health"
  failure_threshold  = 3
  request_interval   = 30
}
