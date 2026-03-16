/**
 * Shared k6 configuration for AtlasIT load tests.
 *
 * Environment variables:
 *   BASE_URL   - Target base URL (default: http://localhost:8787)
 *   API_TOKEN  - Bearer token for authenticated endpoints
 *   TENANT_ID  - Tenant ID header value (default: test-tenant)
 *
 * Thresholds are derived from SLO definitions in
 * packages/shared/src/observability/slo.ts
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
export const BASE_URL = __ENV.BASE_URL || "http://localhost:8787";
export const API_TOKEN = __ENV.API_TOKEN || "";
export const TENANT_ID = __ENV.TENANT_ID || "test-tenant";

// ---------------------------------------------------------------------------
// Common headers
// ---------------------------------------------------------------------------
export function headers() {
  const h = {
    "Content-Type": "application/json",
    "X-Tenant-ID": TENANT_ID,
    "X-Correlation-ID": `k6-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  if (API_TOKEN) {
    h["Authorization"] = `Bearer ${API_TOKEN}`;
  }
  return h;
}

// ---------------------------------------------------------------------------
// SLO-derived thresholds
//
// workflow_execution_success  — 99% success rate (30d)
// api_availability            — 99.9% non-5xx (30d)
// evidence_ingest_success     — 99.9% success rate (30d)
// compliance_snapshot_latency — p95 <= 500ms (7d)
// ---------------------------------------------------------------------------
export const SLO_THRESHOLDS = {
  // API availability: <0.1% 5xx error rate
  http_req_failed: ["rate<0.001"],
  // General p95 latency: align with compliance snapshot SLO
  http_req_duration: ["p(95)<500", "p(99)<1000"],
};

// Per-service thresholds (used by individual scripts via tags)
export const SERVICE_THRESHOLDS = {
  "core-api": {
    "http_req_duration{service:core-api}": ["p(95)<500"],
    "http_req_failed{service:core-api}": ["rate<0.001"],
  },
  orchestrator: {
    "http_req_duration{service:orchestrator}": ["p(95)<500"],
    "http_req_failed{service:orchestrator}": ["rate<0.001"],
  },
  compliance: {
    "http_req_duration{service:compliance}": ["p(95)<500"],
    "http_req_failed{service:compliance}": ["rate<0.001"],
    // Compliance snapshot SLO: p95 <= 500ms
    "http_req_duration{name:compliance-snapshot}": ["p(95)<500"],
  },
};

// ---------------------------------------------------------------------------
// Scenario presets
// ---------------------------------------------------------------------------
export const SCENARIOS = {
  smoke: {
    executor: "constant-vus",
    vus: 1,
    duration: "30s",
  },
  load: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m", target: 50 },
      { duration: "5m", target: 50 },
      { duration: "1m", target: 0 },
    ],
  },
  stress: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m", target: 50 },
      { duration: "3m", target: 100 },
      { duration: "2m", target: 200 },
      { duration: "1m", target: 0 },
    ],
  },
  soak: {
    executor: "constant-vus",
    vus: 20,
    duration: "30m",
  },
};
