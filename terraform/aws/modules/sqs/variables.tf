variable "env" { type = string }

variable "queues" {
  type    = list(string)
  default = ["workflow", "policy-rebuild", "risk-recalc", "remediation"]
}
