/**
 * k6 load test script for AtlasIT Compliance Worker.
 *
 * Endpoints tested:
 *   GET  /health
 *   GET  /api/compliance/snapshot   (compliance scores / snapshot)
 *   POST /api/v1/policy/evaluate    (policy evaluation)
 *   GET  /api/v1/policies/templates (list policy templates)
 *   GET  /api/v1/policies/coverage  (policy coverage summary)
 *   POST /api/evidence/ingest       (evidence upload)
 *   GET  /api/v1/evidence           (list evidence)
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { BASE_URL, headers, TENANT_ID } from "../config.js";

// Compliance worker may run on its own URL
const COMPLIANCE_URL = __ENV.COMPLIANCE_URL || BASE_URL;

/**
 * Run a single iteration of all Compliance endpoint groups.
 */
export default function complianceTests() {
  const params = { headers: headers(), tags: { service: "compliance" } };

  // ------------------------------------------------------------------
  // Health
  // ------------------------------------------------------------------
  group("compliance | health", () => {
    const res = http.get(`${COMPLIANCE_URL}/health`, {
      ...params,
      tags: { ...params.tags, name: "compliance-health" },
    });
    check(res, {
      "health returns 200": (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Compliance snapshot (SLO: p95 <= 500ms)
  // ------------------------------------------------------------------
  group("compliance | snapshot", () => {
    const res = http.get(
      `${COMPLIANCE_URL}/api/compliance/snapshot?tenant_id=${TENANT_ID}`,
      {
        ...params,
        tags: { ...params.tags, name: "compliance-snapshot" },
      },
    );
    check(res, {
      "snapshot returns 200 or 503": (r) =>
        r.status === 200 || r.status === 503,
      "snapshot latency under 500ms": (r) => r.timings.duration < 500,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Policy templates
  // ------------------------------------------------------------------
  group("compliance | policy templates", () => {
    const res = http.get(
      `${COMPLIANCE_URL}/api/v1/policies/templates`,
      {
        ...params,
        tags: { ...params.tags, name: "compliance-policy-templates" },
      },
    );
    check(res, {
      "policy templates returns 200": (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Policy evaluation
  // ------------------------------------------------------------------
  group("compliance | evaluate policy", () => {
    const payload = JSON.stringify({
      policyId: "password-complexity",
      input: {
        minLength: 12,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecial: true,
      },
    });
    const res = http.post(
      `${COMPLIANCE_URL}/api/v1/policy/evaluate`,
      payload,
      {
        ...params,
        tags: { ...params.tags, name: "compliance-evaluate-policy" },
      },
    );
    check(res, {
      "evaluate policy returns 200 or 400": (r) =>
        r.status === 200 || r.status === 400,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Policy coverage
  // ------------------------------------------------------------------
  group("compliance | coverage", () => {
    const res = http.get(
      `${COMPLIANCE_URL}/api/v1/policies/coverage?tenant_id=${TENANT_ID}`,
      {
        ...params,
        tags: { ...params.tags, name: "compliance-coverage" },
      },
    );
    check(res, {
      "coverage returns 200 or 400": (r) =>
        r.status === 200 || r.status === 400,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Evidence ingest
  // ------------------------------------------------------------------
  group("compliance | evidence ingest", () => {
    const payload = JSON.stringify({
      tenant_id: TENANT_ID,
      pack: "k6-test-pack",
      subject_ref: "user:k6-test@example.com",
      payload: {
        type: "k6.load.test",
        data: { iteration: __ITER, vu: __VU },
        collected_at: new Date().toISOString(),
      },
    });
    const res = http.post(
      `${COMPLIANCE_URL}/api/evidence/ingest`,
      payload,
      {
        ...params,
        tags: { ...params.tags, name: "compliance-evidence-ingest" },
      },
    );
    check(res, {
      "evidence ingest returns 200 or 201": (r) =>
        r.status === 200 || r.status === 201,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // List evidence (v1 tenant-scoped)
  // ------------------------------------------------------------------
  group("compliance | list evidence", () => {
    const res = http.get(
      `${COMPLIANCE_URL}/api/v1/evidence?tenant_id=${TENANT_ID}&limit=10`,
      {
        ...params,
        tags: { ...params.tags, name: "compliance-list-evidence" },
      },
    );
    check(res, {
      "list evidence returns 200": (r) => r.status === 200,
    });
  });

  sleep(1);
}
