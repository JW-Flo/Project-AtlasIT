locals {
  s3_origin_id  = "s3-static"
  ssr_origin_id = "ssr-lambda"
  # Strip protocol from Lambda Function URL for custom origin domain
  ssr_domain = replace(replace(var.ssr_lambda_function_url, "https://", ""), "/", "")
}

resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "atlasit-static-oac-${var.env}"
  description                       = "OAC for AtlasIT static assets ${var.env}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "ssr_no_cache" {
  name        = "atlasit-ssr-nocache-${var.env}"
  comment     = "No caching for SSR responses"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    headers_config {
      header_behavior = "none"
    }

    cookies_config {
      cookie_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_distribution" "main" {
  comment         = "AtlasIT Console ${var.env}"
  enabled         = true
  http_version    = "http2and3"
  price_class     = "PriceClass_100"
  is_ipv6_enabled = true
  aliases         = length(var.domain_aliases) > 0 ? var.domain_aliases : []

  # S3 origin for static assets
  origin {
    domain_name              = var.static_bucket_domain
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # Custom origin for SSR Lambda Function URL
  origin {
    domain_name = local.ssr_domain
    origin_id   = local.ssr_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior -> SSR Lambda (no caching, forward all)
  default_cache_behavior {
    target_origin_id       = local.ssr_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = aws_cloudfront_cache_policy.ssr_no_cache.id

    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  # Static assets: /_app/*
  ordered_cache_behavior {
    path_pattern           = "/_app/*"
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # Static assets: /favicon.png
  ordered_cache_behavior {
    path_pattern           = "/favicon.png"
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.acm_certificate_arn != "" ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.acm_certificate_arn == "" ? [1] : []
    content {
      cloudfront_default_certificate = true
    }
  }
}

# AWS managed cache policies
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

# AWS managed origin request policy to forward all viewer headers
data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}
