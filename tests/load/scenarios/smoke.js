/**
 * Smoke test — quick validation that all endpoints respond.
 *
 * 1 VU, 30 seconds. No performance thresholds; just verify connectivity
 * and basic correctness.
 *
 * Usage:
 *   k6 run tests/load/scenarios/smoke.js
 *   k6 run tests/load/scenarios/smoke.js -e BASE_URL=https://api.atlasit.pro
 */

import { SCENARIOS, SLO_THRESHOLDS } from "../config.js";
import coreApiTests from "../scripts/core-api.js";
import orchestratorTests from "../scripts/orchestrator.js";
import complianceTests from "../scripts/compliance.js";

export const options = {
  scenarios: {
    smoke: SCENARIOS.smoke,
  },
  // Relaxed thresholds for smoke: just ensure things work
  thresholds: {
    http_req_failed: ["rate<0.5"], // tolerate up to 50% failures in smoke
    http_req_duration: ["p(95)<2000"], // 2s ceiling
  },
};

export default function () {
  coreApiTests();
  orchestratorTests();
  complianceTests();
}
