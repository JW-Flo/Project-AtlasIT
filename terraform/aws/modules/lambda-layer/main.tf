variable "env" { type = string }
variable "layer_zip_path" { type = string }

resource "aws_lambda_layer_version" "shared" {
  layer_name          = "atlasit-shared-${var.env}"
  filename            = var.layer_zip_path
  compatible_runtimes = ["nodejs20.x"]
  description         = "AtlasIT shared libraries"
}

output "layer_arn" {
  value = aws_lambda_layer_version.shared.arn
}
