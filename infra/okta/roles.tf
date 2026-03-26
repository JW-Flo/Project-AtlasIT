# infra/okta/roles.tf
# Terraform module to create Okta groups for each Ramp role

provider "okta" {
  org_name  = var.okta_org_name  # e.g. "flosports"
  base_url  = var.okta_base_url  # e.g. "okta.com"
  api_token = var.okta_api_token # supplied via TF_VAR_okta_api_token
}

locals {
  ramp_roles = [
    { name = "Ramp_Admins", desc = "Ramp Admin role" },
    { name = "Ramp_Bookkeepers", desc = "Ramp Bookkeeper role" },
    { name = "Ramp_IT_Admins", desc = "Ramp IT Admin role" }
  ]
}

resource "okta_group" "ramp_roles" {
  for_each    = { for r in local.ramp_roles : r.name => r }
  name        = each.value.name
  description = each.value.desc
}
