variable "env" { type = string }
variable "cognito_user_pool_arn" { type = string }
variable "routes" {
  type = map(object({
    method            = string
    lambda_arn        = string
    lambda_invoke_arn = string
    authorizer        = optional(bool, true)
  }))
}
