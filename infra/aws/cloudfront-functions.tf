# CloudFront Functions — lightweight edge logic replacing CF Workers
# CloudFront Functions run at viewer-request, can't access body, max 10KB code

# Apex redirect: atlasit.pro → www.atlasit.pro
resource "aws_cloudfront_function" "apex_redirect" {
  name    = "atlasit-apex-redirect-${var.env}"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      var host = request.headers.host.value;

      // Redirect apex domain to www
      if (host === 'atlasit.pro' || host === 'status.atlasit.pro') {
        return {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: 'https://www.atlasit.pro' + request.uri },
            'cache-control': { value: 'max-age=3600' }
          }
        };
      }

      return request;
    }
  EOF
}

# Security headers on all responses
resource "aws_cloudfront_function" "security_headers" {
  name    = "atlasit-security-headers-${var.env}"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var response = event.response;
      var headers = response.headers;

      headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubDomains; preload' };
      headers['x-content-type-options'] = { value: 'nosniff' };
      headers['x-frame-options'] = { value: 'DENY' };
      headers['x-xss-protection'] = { value: '1; mode=block' };
      headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };

      return response;
    }
  EOF
}
