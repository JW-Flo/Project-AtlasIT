import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/console",
  "/access-requests",
  "/incidents",
  "/api/config",
  "/api/config/features",
];

test.describe("expected routes", () => {
  for (const r of ROUTES) {
    test(`loads ${r}`, async ({ request }) => {
      const res = await request.get(r);
      expect(res.status(), `status ${r}`).toBeLessThan(500);
    });
  }
});
