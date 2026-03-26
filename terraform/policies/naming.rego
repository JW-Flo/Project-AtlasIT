# Naming convention policies for AtlasIT Terraform resources.
#
# Validates:
#   - All Cloudflare resources have atlasit- prefix
#   - Environment values are from allowed set

package naming

import rego.v1

# ──────────────────────────────────────────────
# Allowed environments
# ──────────────────────────────────────────────

allowed_environments := {"dev", "staging", "production"}

# ──────────────────────────────────────────────
# Resource types that must have atlasit- prefix
# ──────────────────────────────────────────────

prefixed_types := {
	"cloudflare_worker_script",
	"cloudflare_workers_kv_namespace",
	"cloudflare_d1_database",
	"cloudflare_r2_bucket",
}

# Name field varies by resource type
resource_name_field(rc) := rc.change.after.name if {
	rc.type == "cloudflare_worker_script"
}

resource_name_field(rc) := rc.change.after.title if {
	rc.type == "cloudflare_workers_kv_namespace"
}

resource_name_field(rc) := rc.change.after.name if {
	rc.type == "cloudflare_d1_database"
}

resource_name_field(rc) := rc.change.after.name if {
	rc.type == "cloudflare_r2_bucket"
}

# ──────────────────────────────────────────────
# All Cloudflare resources must have atlasit- prefix
# ──────────────────────────────────────────────

deny contains msg if {
	some rc in input.resource_changes
	rc.type in prefixed_types
	rc.change.after != null
	name := resource_name_field(rc)
	name != null
	not startswith(name, "atlasit-")
	msg := sprintf(
		"%s '%s' (%s) must have 'atlasit-' prefix. Got: '%s'",
		[rc.type, rc.name, rc.address, name],
	)
}

# ──────────────────────────────────────────────
# Environment variables must be from allowed set
# ──────────────────────────────────────────────

deny contains msg if {
	some var_name in ["environment", "env"]
	some rc in input.configuration.root_module.variables
	rc.default != null
	lower(rc.default) != ""
	not rc.default in allowed_environments
	msg := sprintf(
		"Environment variable default '%s' is not in allowed set: %v",
		[rc.default, allowed_environments],
	)
}

# Check environment in resource names matches allowed set
warn contains msg if {
	some rc in input.resource_changes
	rc.type in prefixed_types
	rc.change.after != null
	name := resource_name_field(rc)
	name != null
	startswith(name, "atlasit-")

	# Extract the last segment after the final hyphen as potential env
	parts := split(name, "-")
	count(parts) >= 3
	env_candidate := parts[count(parts) - 1]

	# Only warn if it looks like an environment but isn't in the allowed set
	env_candidate in {"dev", "staging", "production", "prod", "test", "qa", "uat"}
	not env_candidate in allowed_environments

	# prod is a common abbreviation -- suggest production instead
	msg := sprintf(
		"Resource '%s' uses environment suffix '%s'. Allowed environments are: %v",
		[name, env_candidate, allowed_environments],
	)
}
