variable "env" {
  description = "Deployment environment label (e.g., dev, staging)"
  type        = string
}

variable "secrets" {
  description = "Map of secret names to values"
  type        = map(string)
  sensitive   = false
}
