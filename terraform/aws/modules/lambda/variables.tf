variable "env" { type = string }
variable "function_name" { type = string }
variable "handler" {
  type    = string
  default = "handler.handler"
}
variable "runtime" {
  type    = string
  default = "nodejs20.x"
}
variable "memory_size" {
  type    = number
  default = 256
}
variable "timeout" {
  type    = number
  default = 30
}
variable "environment_variables" {
  type    = map(string)
  default = {}
}
variable "layer_arns" {
  type    = list(string)
  default = []
}
variable "source_dir" { type = string }
variable "dynamodb_table_arn" {
  type    = string
  default = ""
}
variable "enable_dynamodb" {
  type    = bool
  default = false
}
variable "s3_bucket_arn" {
  type    = string
  default = ""
}
variable "enable_s3" {
  type    = bool
  default = false
}
variable "ssm_prefix" {
  type    = string
  default = ""
}
variable "enable_ssm" {
  type    = bool
  default = false
}
variable "additional_policies" {
  type    = list(string)
  default = []
}
