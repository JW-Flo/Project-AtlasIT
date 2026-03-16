# Security guardrail policies for AtlasIT Terraform resources.
#
# Validates:
#   - No hardcoded secrets in variable defaults
#   - Workers must include security-headers middleware
#   - No wildcard CORS origins in production

package security

import rego.v1

# ──────────────────────────────────────────────
# Helper: patterns that look like secrets/tokens
# ──────────────────────────────────────────────

secret_patterns := [
	"sk-",
	"sk_live_",
	"sk_test_",
	"ghp_",
	"gho_",
	"github_pat_",
	"xoxb-",
	"xoxp-",
	"AKIA",
	"eyJhbG",
	"-----BEGIN",
]

looks_like_secret(val) if {
	is_string(val)
	count(val) > 16
	some pattern in secret_patterns
	contains(val, pattern)
}

# Also flag long hex/base64 strings as potential secrets
looks_like_secret(val) if {
	is_string(val)
	count(val) >= 32
	regex.match(`^[A-Za-z0-9+/=_-]{32,}$`, val)
}

# ──────────────────────────────────────────────
# No hardcoded secrets in Terraform variable defaults
# ──────────────────────────────────────────────

deny contains msg if {
	some rc in input.configuration.root_module.variables
	default_val := rc.default
	default_val != null
	looks_like_secret(default_val)
	msg := sprintf(
		"Variable appears to contain a hardcoded secret as default value. Remove the default and use environment variables or secret management.",
		[],
	)
}

# Check variables in child modules too
deny contains msg if {
	some mod in input.configuration.root_module.module_calls
	some var_name, var_def in mod.module.variables
	default_val := var_def.default
	default_val != null
	looks_like_secret(default_val)
	msg := sprintf(
		"Module '%s' variable '%s' appears to contain a hardcoded secret. Remove the default value.",
		[mod.source, var_name],
	)
}

# ──────────────────────────────────────────────
# Workers should have security-headers in plain_text_binding or service_binding
# ──────────────────────────────────────────────

warn contains msg if {
	some rc in input.resource_changes
	rc.type == "cloudflare_worker_script"
	rc.change.after != null
	name := rc.change.after.name

	# Check plain_text_bindings for a SECURITY_HEADERS reference
	not has_security_headers(rc.change.after)
	msg := sprintf(
		"Worker '%s' (%s) should include security-headers middleware binding for defense-in-depth",
		[name, rc.address],
	)
}

has_security_headers(worker) if {
	some b in worker.plain_text_binding
	b.name == "SECURITY_HEADERS_ENABLED"
	b.text == "true"
}

has_security_headers(worker) if {
	some b in worker.service_binding
	contains(b.service, "security-headers")
}

# ──────────────────────────────────────────────
# No wildcard CORS origins in production workers
# ──────────────────────────────────────────────

deny contains msg if {
	some rc in input.resource_changes
	rc.type == "cloudflare_worker_script"
	rc.change.after != null

	# Check plain_text_bindings for CORS config
	some b in rc.change.after.plain_text_binding
	b.name == "CORS_ORIGINS"
	contains(b.text, "*")

	# Only enforce for production names
	contains(rc.change.after.name, "prod")
	msg := sprintf(
		"Worker '%s' must not use wildcard '*' in CORS_ORIGINS for production. Specify explicit origins.",
		[rc.change.after.name],
	)
}

deny contains msg if {
	some rc in input.resource_changes
	rc.type == "cloudflare_worker_script"
	rc.change.after != null
	some b in rc.change.after.plain_text_binding
	b.name == "CORS_ORIGINS"
	contains(b.text, "*")
	contains(rc.change.after.name, "production")
	msg := sprintf(
		"Worker '%s' must not use wildcard '*' in CORS_ORIGINS for production. Specify explicit origins.",
		[rc.change.after.name],
	)
}
