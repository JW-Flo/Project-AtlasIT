# AtlasIT Terraform Policy Bundle
# Entrypoint that aggregates all policy modules.
#
# Usage:
#   conftest test --policy terraform/policies/ tfplan.json

package main

import data.cloudflare
import data.security
import data.naming

import rego.v1

# Collect all deny messages from sub-packages
deny contains msg if {
	some msg in cloudflare.deny
}

deny contains msg if {
	some msg in security.deny
}

deny contains msg if {
	some msg in naming.deny
}

# Collect all warn messages from sub-packages
warn contains msg if {
	some msg in cloudflare.warn
}

warn contains msg if {
	some msg in security.warn
}

warn contains msg if {
	some msg in naming.warn
}
