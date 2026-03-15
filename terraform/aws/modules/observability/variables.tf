variable "env" { type = string }

variable "lambda_function_names" {
  type    = list(string)
  default = []
}

variable "api_gateway_id" {
  type    = string
  default = ""
}

variable "enable_api_gateway_alarms" {
  type    = bool
  default = false
}

variable "dlq_arns" {
  type    = map(string)
  default = {}
}

variable "alarm_email" {
  type    = string
  default = ""
}
