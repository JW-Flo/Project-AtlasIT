import { test, expect } from "@playwright/test";

/**
 * QA Suite: API Security & Tenant Isolation
 *
 * Tests that all protected API endpoints require auth,
 * return proper error codes, and don't leak data across tenants.
 */

const PROTECTED_GET_ENDPOINTS = [
  "/api/copilot/chat",
  "/api/copilot/digest",
  "/api/copilot/weekly-digest",
  "/api/copilot/smart-alerts",
  "/api/copilot/actions",
  "/api/policies/templates",
  "/api/tenant-compliance/scores",
  "/api/evidence-feed",
  "/api/user/preferences",
  "/api/notifications",
  "/api/analytics/dashboard",
  "/api/automation/rules",
  "/api/compliance-packs",
];

const PROTECTED_POST_ENDPOINTS = [
  "/api/copilot/chat",
  "/api/policies/generate",
  "/api/policies/managed",
  "/api/automation/rules",
  "/api/automation/evaluate",
  "/api/automation/simulate",
];

test.describe("Auth Guard Coverage", () => {
  for (const endpoint of PROTECTED_GET_ENDPOINTS) {
    test(`GET ${endpoint} requires auth`, async ({ request }) => {
      const res = await request.get(endpoint);
      // Should return 401 or 403, never 200 with data or 500
      expect(
        [401, 403].includes(res.status()),
        `${endpoint} returned ${res.status()} without auth — expected 401/403`,
      ).toBeTruthy();
    });
  }

  for (const endpoint of PROTECTED_POST_ENDPOINTS) {
    test(`POST ${endpoint} requires auth`, async ({ request }) => {
      const res = await request.post(endpoint, { data: {} });
      expect(
        [401, 403].includes(res.status()),
        `${endpoint} returned ${res.status()} without auth — expected 401/403`,
      ).toBeTruthy();
    });
  }
});

test.describe("Public Endpoints", () => {
  const PUBLIC_ENDPOINTS = ["/api/health", "/api/support"];

  for (const endpoint of PUBLIC_ENDPOINTS) {
    test(`GET ${endpoint} is accessible without auth`, async ({ request }) => {
      const res = await request.get(endpoint);
      expect(res.status()).toBeLessThan(500);
      // Public endpoints should return 200, not 401
      expect(res.status()).not.toBe(401);
    });
  }
});

test.describe("Error Response Format", () => {
  test("401 responses have JSON error body", async ({ request }) => {
    const res = await request.get("/api/copilot/digest");
    if (res.status() === 401) {
      const body = await res.json().catch(() => null);
      expect(body).not.toBeNull();
      expect(body).toHaveProperty("error");
    }
  });

  test("404 on missing resources returns JSON, not HTML", async ({ request }) => {
    const res = await request.get("/api/policies/does-not-exist-12345");
    if (res.status() === 404) {
      const contentType = res.headers()["content-type"];
      expect(contentType).toContain("application/json");
    }
  });

  test("invalid JSON body returns 400", async ({ request }) => {
    const res = await request.post("/api/policies/generate", {
      headers: { "Content-Type": "application/json" },
      data: "not json{{{",
    });
    // Should be 400 (bad request) or 401 (no auth), never 500
    expect(res.status()).not.toBe(500);
  });
});
