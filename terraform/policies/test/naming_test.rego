# Tests for naming convention policies.

package naming_test

import data.naming
import rego.v1

# ──────────────────────────────────────────────
# atlasit- prefix enforcement
# ──────────────────────────────────────────────

test_worker_with_prefix_allowed if {
	count(naming.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {"name": "atlasit-core-api-dev"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_worker_without_prefix_denied if {
	count(naming.deny) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {"name": "my-worker-dev"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_kv_namespace_with_prefix_allowed if {
	count(naming.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_workers_kv_namespace",
			"name": "sessions",
			"address": "cloudflare_workers_kv_namespace.sessions",
			"change": {"after": {"title": "atlasit-sessions-dev"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_kv_namespace_without_prefix_denied if {
	count(naming.deny) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_workers_kv_namespace",
			"name": "sessions",
			"address": "cloudflare_workers_kv_namespace.sessions",
			"change": {"after": {"title": "SESSIONS_KV"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_d1_with_prefix_allowed if {
	count(naming.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_d1_database",
			"name": "main",
			"address": "cloudflare_d1_database.main",
			"change": {"after": {"name": "atlasit-core-db-dev"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_d1_without_prefix_denied if {
	count(naming.deny) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_d1_database",
			"name": "main",
			"address": "cloudflare_d1_database.main",
			"change": {"after": {"name": "my_database"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_r2_with_prefix_allowed if {
	count(naming.deny) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_r2_bucket",
			"name": "artifacts",
			"address": "cloudflare_r2_bucket.artifacts",
			"change": {"after": {"name": "atlasit-artifacts-dev"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_r2_without_prefix_denied if {
	count(naming.deny) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_r2_bucket",
			"name": "artifacts",
			"address": "cloudflare_r2_bucket.artifacts",
			"change": {"after": {"name": "evidence-bucket"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

# ──────────────────────────────────────────────
# Environment suffix warnings
# ──────────────────────────────────────────────

test_prod_suffix_warns if {
	count(naming.warn) > 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {"name": "atlasit-core-api-prod"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_production_suffix_no_warning if {
	count(naming.warn) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {"name": "atlasit-core-api-production"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

test_dev_suffix_no_warning if {
	count(naming.warn) == 0 with input as {
		"resource_changes": [{
			"type": "cloudflare_worker_script",
			"name": "core_api",
			"address": "cloudflare_worker_script.core_api",
			"change": {"after": {"name": "atlasit-core-api-dev"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}

# ──────────────────────────────────────────────
# Non-Cloudflare resources are not checked
# ──────────────────────────────────────────────

test_non_cloudflare_resource_ignored if {
	count(naming.deny) == 0 with input as {
		"resource_changes": [{
			"type": "aws_s3_bucket",
			"name": "logs",
			"address": "aws_s3_bucket.logs",
			"change": {"after": {"bucket": "my-logs-bucket"}},
		}],
		"configuration": {"root_module": {"variables": {}}},
	}
}
