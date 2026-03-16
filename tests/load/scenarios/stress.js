/**
 * Stress test — find the breaking point.
 *
 * Stages: 0->50 (2min) -> 100 (3min) -> 200 (2min) -> 0 (1min).
 * Expect some failures at peak load. The goal is to identify the
 * degradation curve and failure modes.
 *
 * Usage:
 *   k6 run tests/load/scenarios/stress.js
 *   k6 run tests/load/scenarios/stress.js -e BASE_URL=https://api.atlasit.pro
 */

import { SCENARIOS, SLO_THRESHOLDS } from "../config.js";
import coreApiTests from "../scripts/core-api.js";
import orchestratorTests from "../scripts/orchestrator.js";
import complianceTests from "../scripts/compliance.js";

export const options = {
  scenarios: {
    stress: SCENARIOS.stress,
  },
  thresholds: {
    // Relaxed: we expect degradation under extreme load
    http_req_failed: ["rate<0.05"], // up to 5% failures acceptable
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    // Keep compliance snapshot SLO visible even if it breaches
    "http_req_duration{name:compliance-snapshot}": [
      { threshold: "p(95)<500", abortOnFail: false },
    ],
  },
};

export default function () {
  coreApiTests();
  orchestratorTests();
  complianceTests();
}
