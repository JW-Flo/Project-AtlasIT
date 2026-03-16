# Tests for Cloudflare-specific policies.

package cloudflare_test

import data.cloudflare
import rego.v1

# ──────────────────────────────────────────────
# KV namespace naming
# ──────────────────────────────────────────────

test_kv_namespace_valid_name if {
	count(cloudflare.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_workers_kv_namespace",
			"name": "state",
			"address": "cloudflare_workers_kv_namespace.state",
			"change": {"after": {"title": "atlasit-state-dev"}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

test_kv_namespace_invalid_name if {
	count(cloudflare.deny) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_workers_kv_namespace",
			"name": "state",
			"address": "cloudflare_workers_kv_namespace.state",
			"change": {"after": {"title": "my-random-kv"}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

# ──────────────────────────────────────────────
# D1 database location hint
# ──────────────────────────────────────────────

test_d1_database_with_location if {
	count(cloudflare.warn) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_d1_database",
			"name": "main",
			"address": "cloudflare_d1_database.main",
			"change": {"after": {
				"name": "atlasit-db-dev",
				"location": "enam",
			}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

test_d1_database_without_location if {
	count(cloudflare.warn) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_d1_database",
			"name": "main",
			"address": "cloudflare_d1_database.main",
			"change": {"after": {"name": "atlasit-db-dev"}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

# ──────────────────────────────────────────────
# R2 bucket public access
# ──────────────────────────────────────────────

test_r2_bucket_private if {
	count(cloudflare.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_r2_bucket",
			"name": "artifacts",
			"address": "cloudflare_r2_bucket.artifacts",
			"change": {"after": {
				"name": "atlasit-artifacts",
				"public_access": false,
			}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

test_r2_bucket_public_denied if {
	count(cloudflare.deny) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_r2_bucket",
			"name": "artifacts",
			"address": "cloudflare_r2_bucket.artifacts",
			"change": {"after": {
				"name": "atlasit-artifacts",
				"public_access": true,
			}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

# ──────────────────────────────────────────────
# Worker rate limit binding
# ──────────────────────────────────────────────

test_worker_with_rate_limit_binding if {
	count(cloudflare.warn) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {
				"name": "atlasit-core-api-dev",
				"kv_namespace_binding": [
					{
						"name": "RATE_LIMIT_KV",
						"namespace_id": "abc123",
					},
					{
						"name": "STATE",
						"namespace_id": "def456",
					},
				],
			}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

test_worker_without_rate_limit_binding if {
	count(cloudflare.warn) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {
				"name": "atlasit-core-api-dev",
				"kv_namespace_binding": [{
					"name": "STATE",
					"namespace_id": "def456",
				}],
			}},
		}],
		"planned_values": {"root_module": {"resources": []}},
	}
}

# ──────────────────────────────────────────────
# No resource changes = no violations
# ──────────────────────────────────────────────

test_empty_plan_no_violations if {
	count(cloudflare.deny) == 0 with input as {
		"resource_changes": [],
		"planned_values": {"root_module": {"resources": []}},
	}
}
