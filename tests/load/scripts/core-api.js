/**
 * k6 load test script for AtlasIT Core API.
 *
 * Endpoints tested:
 *   GET  /health
 *   GET  /api/v1/tenants
 *   POST /api/v1/tenants
 *   GET  /api/v1/tenants/:id
 *   GET  /api/v1/flags
 *   POST /api/v1/events
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { BASE_URL, headers, TENANT_ID } from "../config.js";

/**
 * Run a single iteration of all Core API endpoint groups.
 * Called by scenario files — not executed directly.
 */
export default function coreApiTests() {
  const params = { headers: headers(), tags: { service: "core-api" } };

  // ------------------------------------------------------------------
  // Health
  // ------------------------------------------------------------------
  group("core-api | health", () => {
    const res = http.get(`${BASE_URL}/health`, {
      ...params,
      tags: { ...params.tags, name: "core-api-health" },
    });
    check(res, {
      "health returns 200": (r) => r.status === 200,
      "health body has status": (r) => {
        const body = r.json();
        return body && body.status !== undefined;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // List tenants
  // ------------------------------------------------------------------
  group("core-api | list tenants", () => {
    const res = http.get(`${BASE_URL}/api/v1/tenants?limit=10`, {
      ...params,
      tags: { ...params.tags, name: "core-api-list-tenants" },
    });
    check(res, {
      "list tenants returns 200": (r) => r.status === 200,
      "list tenants has data array": (r) => {
        const body = r.json();
        return body && Array.isArray(body.data);
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Create tenant
  // ------------------------------------------------------------------
  let createdTenantId = null;
  group("core-api | create tenant", () => {
    const slug = `k6-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = JSON.stringify({
      name: `K6 Test Tenant ${slug}`,
      slug: slug,
      industry: "technology",
      tier: "free",
    });
    const res = http.post(`${BASE_URL}/api/v1/tenants`, payload, {
      ...params,
      tags: { ...params.tags, name: "core-api-create-tenant" },
    });
    check(res, {
      "create tenant returns 201": (r) => r.status === 201,
      "create tenant has id": (r) => {
        const body = r.json();
        if (body && body.data && body.data.id) {
          createdTenantId = body.data.id;
          return true;
        }
        return false;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Get tenant by ID
  // ------------------------------------------------------------------
  group("core-api | get tenant", () => {
    const id = createdTenantId || "00000000-0000-0000-0000-000000000000";
    const res = http.get(`${BASE_URL}/api/v1/tenants/${id}`, {
      ...params,
      tags: { ...params.tags, name: "core-api-get-tenant" },
    });
    check(res, {
      "get tenant returns 200 or 404": (r) =>
        r.status === 200 || r.status === 404,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // List feature flags
  // ------------------------------------------------------------------
  group("core-api | list flags", () => {
    const res = http.get(`${BASE_URL}/api/v1/flags`, {
      ...params,
      tags: { ...params.tags, name: "core-api-list-flags" },
    });
    check(res, {
      "list flags returns 200": (r) => r.status === 200,
      "list flags has data": (r) => {
        const body = r.json();
        return body && body.data !== undefined;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Publish event
  // ------------------------------------------------------------------
  group("core-api | publish event", () => {
    const payload = JSON.stringify({
      tenantId: createdTenantId || TENANT_ID,
      type: "k6.test.event",
      source: "k6-load-test",
      payload: { timestamp: new Date().toISOString(), iteration: __ITER },
    });
    const res = http.post(`${BASE_URL}/api/v1/events`, payload, {
      ...params,
      tags: { ...params.tags, name: "core-api-publish-event" },
    });
    check(res, {
      "publish event returns 201": (r) => r.status === 201,
      "publish event has event id": (r) => {
        const body = r.json();
        return body && body.data && body.data.id;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Cleanup: delete created tenant
  // ------------------------------------------------------------------
  if (createdTenantId) {
    group("core-api | cleanup tenant", () => {
      const res = http.del(`${BASE_URL}/api/v1/tenants/${createdTenantId}`, null, {
        ...params,
        tags: { ...params.tags, name: "core-api-delete-tenant" },
      });
      check(res, {
        "delete tenant returns 200": (r) => r.status === 200,
      });
    });
  }

  sleep(1);
}
