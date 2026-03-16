/**
 * Soak test — endurance run to detect memory leaks and degradation.
 *
 * 20 VUs sustained for 30 minutes. Monitors for latency creep,
 * error rate increase, or resource exhaustion over time.
 *
 * Usage:
 *   k6 run tests/load/scenarios/soak.js
 *   k6 run tests/load/scenarios/soak.js -e BASE_URL=https://api.atlasit.pro
 */

import { SCENARIOS, SLO_THRESHOLDS, SERVICE_THRESHOLDS } from "../config.js";
import coreApiTests from "../scripts/core-api.js";
import orchestratorTests from "../scripts/orchestrator.js";
import complianceTests from "../scripts/compliance.js";

export const options = {
  scenarios: {
    soak: SCENARIOS.soak,
  },
  thresholds: {
    // Strict SLO thresholds — soak should not degrade
    ...SLO_THRESHOLDS,
    ...SERVICE_THRESHOLDS["core-api"],
    ...SERVICE_THRESHOLDS.orchestrator,
    ...SERVICE_THRESHOLDS.compliance,
  },
};

export default function () {
  coreApiTests();
  orchestratorTests();
  complianceTests();
}
