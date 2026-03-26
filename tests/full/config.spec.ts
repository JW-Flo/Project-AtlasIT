import { test, expect } from "@playwright/test";

test.describe("config endpoint", () => {
  test("root config returns bases", async ({ request }) => {
    const res = await request.get("/api/config");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.complianceBase).toBe("string");
    expect(Array.isArray(body.fallbackBases)).toBeTruthy();
  });

  test("features subpath returns placeholder payload", async ({ request }) => {
    const res = await request.get("/api/config/features");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.features)).toBeTruthy();
  });

  test("unknown subpath 404", async ({ request }) => {
    const res = await request.get("/api/config/unknown-segment");
    expect(res.status()).toBe(404);
  });
});
