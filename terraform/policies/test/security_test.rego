# Tests for security policies.

package security_test

import data.security
import rego.v1

# ──────────────────────────────────────────────
# Hardcoded secrets in variable defaults
# ──────────────────────────────────────────────

test_no_secret_in_defaults if {
	count(security.deny) == 0 with input as {
		"resource_changes": [],
		"configuration": {"root_module": {"variables": {
			"environment": {"default": "dev"},
			"region": {"default": "auto"},
		}}},
	}
}

test_github_pat_in_defaults_denied if {
	count(security.deny) > 0 with input as {
		"resource_changes": [],
		"configuration": {"root_module": {"variables": {"api_token": {"default": "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh"}}}},
	}
}

test_aws_key_in_defaults_denied if {
	count(security.deny) > 0 with input as {
		"resource_changes": [],
		"configuration": {"root_module": {"variables": {"aws_key": {"default": "AKIAIOSFODNN7EXAMPLE12345678"}}}},
	}
}

test_short_default_allowed if {
	count(security.deny) == 0 with input as {
		"resource_changes": [],
		"configuration": {"root_module": {"variables": {"name": {"default": "hello"}}}},
	}
}

# ──────────────────────────────────────────────
# Security headers middleware
# ──────────────────────────────────────────────

test_worker_with_security_headers if {
	count(security.warn) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {
				"name": "atlasit-core-api-dev",
				"plain_text_binding": [{
					"name": "SECURITY_HEADERS_ENABLED",
					"text": "true",
				}],
			}},
		}],
	}
}

test_worker_without_security_headers if {
	count(security.warn) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {
				"name": "atlasit-core-api-dev",
				"plain_text_binding": [{
					"name": "OTHER_SETTING",
					"text": "value",
				}],
			}},
		}],
	}
}

# ──────────────────────────────────────────────
# Wildcard CORS in production
# ──────────────────────────────────────────────

test_cors_wildcard_in_prod_denied if {
	count(security.deny) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {
				"name": "atlasit-core-api-production",
				"plain_text_binding": [{
					"name": "CORS_ORIGINS",
					"text": "*",
				}],
			}},
		}],
	}
}

test_cors_explicit_origins_in_prod_allowed if {
	count(security.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {
				"name": "atlasit-core-api-production",
				"plain_text_binding": [{
					"name": "CORS_ORIGINS",
					"text": "https://app.atlasit.pro,https://console.atlasit.pro",
				}],
			}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_cors_wildcard_in_dev_allowed if {
	count(security.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {
				"name": "atlasit-core-api-dev",
				"plain_text_binding": [{
					"name": "CORS_ORIGINS",
					"text": "*",
				}],
			}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}
