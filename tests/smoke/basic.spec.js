// Basic Playwright smoke tests (JS to avoid TS project parser conflicts)
// Basic Playwright smoke tests (ESM)
import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("health + console page", async ({ request, page }) => {
    // health
    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    const hjson = await health.json();
    expect(hjson.status).toBe("ok");
    // visit console page (or root redirect)
    const res = await page.goto("/console");
    expect(res && res.status()).toBeLessThan(500);
    await expect(page.locator("body")).toContainText("AtlasIT Console");
  });
});
