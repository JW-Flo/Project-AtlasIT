resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "atlasit-${var.env}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway 4xx / 5xx Rates"
          view    = "timeSeries"
          region  = "us-east-1"
          metrics = [
            ["AWS/ApiGateway", "4xx", "ApiId", var.api_gateway_id, { stat = "Sum", period = 300 }],
            ["AWS/ApiGateway", "5xx", "ApiId", var.api_gateway_id, { stat = "Sum", period = 300 }],
            ["AWS/ApiGateway", "Count", "ApiId", var.api_gateway_id, { stat = "Sum", period = 300 }],
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "DynamoDB Consumed Read/Write Capacity"
          view    = "timeSeries"
          region  = "us-east-1"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "atlasit-${var.env}", { stat = "Sum", period = 300 }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "atlasit-${var.env}", { stat = "Sum", period = 300 }],
          ]
        }
      },
    ]
  })
}
