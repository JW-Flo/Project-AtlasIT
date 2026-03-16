/**
 * Load test — normal expected traffic pattern.
 *
 * Ramp from 0 to 50 VUs over 2 minutes, sustain for 5 minutes,
 * then ramp down over 1 minute. Uses SLO-derived thresholds.
 *
 * Usage:
 *   k6 run tests/load/scenarios/load.js
 *   k6 run tests/load/scenarios/load.js -e BASE_URL=https://api.atlasit.pro
 */

import { SCENARIOS, SLO_THRESHOLDS, SERVICE_THRESHOLDS } from "../config.js";
import coreApiTests from "../scripts/core-api.js";
import orchestratorTests from "../scripts/orchestrator.js";
import complianceTests from "../scripts/compliance.js";

export const options = {
  scenarios: {
    load: SCENARIOS.load,
  },
  thresholds: {
    // Global SLO thresholds
    ...SLO_THRESHOLDS,
    // Per-service thresholds
    ...SERVICE_THRESHOLDS["core-api"],
    ...SERVICE_THRESHOLDS.orchestrator,
    ...SERVICE_THRESHOLDS.compliance,
  },
};

export default function () {
  // Distribute load across services. Each VU runs all three.
  coreApiTests();
  orchestratorTests();
  complianceTests();
}
