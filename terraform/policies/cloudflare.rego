# Cloudflare-specific policy rules for AtlasIT infrastructure.
#
# Validates:
#   - KV namespace naming conventions
#   - D1 database location hints
#   - R2 bucket public access restrictions
#   - Worker binding requirements

package cloudflare

import rego.v1

# ──────────────────────────────────────────────
# Helper: extract planned resource changes
# ──────────────────────────────────────────────

resources contains rc if {
	some rc in input.resource_changes
}

planned_values contains rv if {
	some rv in input.planned_values.root_module.resources
}

# Also check child module resources
planned_values contains rv if {
	some mod in input.planned_values.root_module.child_modules
	some rv in mod.resources
}

# ──────────────────────────────────────────────
# KV namespaces must follow atlasit-{purpose} naming
# ──────────────────────────────────────────────

deny contains msg if {
	some rc in resources
	rc.type == "cloudflare_workers_kv_namespace"
	rc.change.after != null
	title := rc.change.after.title
	not startswith(title, "atlasit-")
	msg := sprintf(
		"KV namespace '%s' (%s) must follow naming convention 'atlasit-{purpose}'. Got title: '%s'",
		[rc.name, rc.address, title],
	)
}

# ──────────────────────────────────────────────
# D1 databases must have location hint set
# ──────────────────────────────────────────────

warn contains msg if {
	some rc in resources
	rc.type == "cloudflare_d1_database"
	rc.change.after != null
	not rc.change.after.location
	msg := sprintf(
		"D1 database '%s' (%s) should have a location hint set for optimal performance",
		[rc.name, rc.address],
	)
}

# ──────────────────────────────────────────────
# R2 buckets must not have public access enabled
# ──────────────────────────────────────────────

deny contains msg if {
	some rc in resources
	rc.type == "cloudflare_r2_bucket"
	rc.change.after != null
	rc.change.after.public_access == true
	msg := sprintf(
		"R2 bucket '%s' (%s) must not have public access enabled. Use Workers to serve content.",
		[rc.name, rc.address],
	)
}

# ──────────────────────────────────────────────
# Workers must bind to rate limiting (KV with RATE_LIMIT in name)
# ──────────────────────────────────────────────

warn contains msg if {
	some rc in resources
	rc.type == "cloudflare_worker_script"
	rc.change.after != null

	# Check if any KV binding has "RATE_LIMIT" in name
	bindings := rc.change.after.kv_namespace_binding
	bindings != null
	not has_rate_limit_binding(bindings)
	msg := sprintf(
		"Worker '%s' (%s) should bind to a rate-limiting KV namespace (binding name containing 'RATE_LIMIT')",
		[rc.name, rc.address],
	)
}

has_rate_limit_binding(bindings) if {
	some b in bindings
	contains(b.name, "RATE_LIMIT")
}
