variable "env" {
  type = string
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:5173/auth/callback"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["http://localhost:5173"]
}
