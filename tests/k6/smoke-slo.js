import { check, sleep } from "k6";
import http from "k6/http";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

const BASE_URL = __ENV.BASE_URL || "https://www.atlasit.pro";
const ORCHESTRATOR_URL = __ENV.ORCHESTRATOR_URL || "https://orchestrator.atlasit.pro";
const COMPLIANCE_URL = __ENV.COMPLIANCE_URL || "https://compliance.atlasit.pro";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2500"], // LCP budget
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

export default function () {
  // GET /health
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    "health: status 200": (r) => r.status === 200,
    "health: p95 < 500ms": (r) => r.timings.duration < 500,
  });

  // GET /api/config
  const configRes = http.get(`${BASE_URL}/api/config`);
  check(configRes, {
    "config: status 200": (r) => r.status === 200,
    "config: p95 < 1000ms": (r) => r.timings.duration < 1000,
  });

  // GET orchestrator /health
  const orchRes = http.get(`${ORCHESTRATOR_URL}/health`);
  check(orchRes, {
    "orchestrator health: status 200": (r) => r.status === 200,
    "orchestrator health: p95 < 500ms": (r) => r.timings.duration < 500,
  });

  // GET compliance /health
  const compRes = http.get(`${COMPLIANCE_URL}/health`);
  check(compRes, {
    "compliance health: status 200": (r) => r.status === 200,
    "compliance health: p95 < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "results/k6-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
