variable "env" { type = string }

variable "event_bus_name" { type = string }
variable "event_bus_arn" { type = string }

variable "scheduler_lambda_arn" { type = string }

variable "etl_lambda_arn" {
  type    = string
  default = ""
}
