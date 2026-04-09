# CloudFront distribution — single distribution with host-based routing via Lambda@Edge
# Covers: atlasit.pro, *.atlasit.pro (api, www, compliance, docs, orchestrator, adapters)

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  price_class         = "PriceClass_100"
  comment             = "AtlasIT ${var.env} distribution"
  default_root_object = "index.html"

  aliases = [
    var.domain,
    "*.${var.domain}",
  ]

  # Origin: S3 for static console/docs assets
  origin {
    domain_name              = aws_s3_bucket.console.bucket_regional_domain_name
    origin_id                = "s3-console"
    origin_access_control_id = aws_cloudfront_origin_access_control.console.id
  }

  # Origin: API Gateway for all API/dynamic traffic
  origin {
    domain_name = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
    origin_id   = "apigw"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default: S3 static assets (console SPA)
  default_cache_behavior {
    target_origin_id       = "s3-console"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # /api/* → API Gateway (no caching)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "apigw"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "x-tenant-id", "Origin", "Host"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # /health → API Gateway (no caching)
  ordered_cache_behavior {
    path_pattern           = "/health"
    target_origin_id       = "apigw"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.main.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  web_acl_id = aws_wafv2_web_acl.edge.arn

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
  }
}

# OAC for S3 console origin
resource "aws_cloudfront_origin_access_control" "console" {
  name                              = "atlasit-console-oac-${var.env}"
  description                       = "OAC for console S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}
