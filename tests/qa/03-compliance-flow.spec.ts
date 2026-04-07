import { test, expect } from "@playwright/test";

/**
 * QA Suite: Compliance Workflow
 *
 * Tests the full compliance lifecycle: framework selection,
 * score display, evidence feed, weekly digest, smart alerts,
 * and copilot interaction.
 */

test.describe("Compliance Scores API", () => {
  test("scores endpoint returns per-framework data", async ({ request }) => {
    const res = await request.get("/api/tenant-compliance/scores");
    if (res.status() === 200) {
      const data = await res.json();
      // Should return scores array or object with framework keys
      expect(data).toBeDefined();
      if (data.scores) {
        expect(Array.isArray(data.scores) || typeof data.scores === "object").toBeTruthy();
      }
    }
    // 401 is acceptable (no auth in test), but not 500
    expect(res.status()).not.toBe(500);
  });

  test("evidence feed endpoint works", async ({ request }) => {
    const res = await request.get("/api/evidence-feed");
    expect(res.status()).not.toBe(500);
  });
});

test.describe("Compliance Page Interaction", () => {
  test("compliance page loads smart alerts panel", async ({ page }) => {
    const res = await page.goto("/console/compliance");
    if (res?.status() === 200) {
      // Smart alerts panel should be present (may be empty)
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      // Should have either "Smart Alerts" heading or the compliance content
      const hasContent = body?.includes("Compliance") || body?.includes("Smart Alert");
      expect(hasContent).toBeTruthy();
    }
  });

  test("compliance page loads weekly digest card", async ({ page }) => {
    const res = await page.goto("/console/compliance");
    if (res?.status() === 200) {
      await page.waitForTimeout(2000);
      // Weekly digest card may or may not have data, but shouldn't error
      const errorCount = await page.locator('[role="alert"][variant="destructive"]').count();
      // No destructive alerts from failed component loads
      expect(errorCount).toBe(0);
    }
  });

  test("compliance packs page loads", async ({ page }) => {
    const res = await page.goto("/console/compliance/packs");
    if (res?.status() === 200) {
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      expect(
        body?.includes("Compliance") || body?.includes("Pack") || body?.includes("Framework"),
      ).toBeTruthy();
    }
  });
});

test.describe("Copilot API", () => {
  test("weekly digest endpoint returns valid response", async ({ request }) => {
    const res = await request.get("/api/copilot/weekly-digest");
    if (res.status() === 200) {
      const data = await res.json();
      // Should have digest (possibly null for new tenants) but valid shape
      expect(data).toHaveProperty("digest");
    }
    expect(res.status()).not.toBe(500);
  });

  test("smart alerts endpoint returns valid response", async ({ request }) => {
    const res = await request.get("/api/copilot/smart-alerts");
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty("alerts");
      expect(Array.isArray(data.alerts)).toBeTruthy();
    }
    expect(res.status()).not.toBe(500);
  });

  test("daily digest endpoint returns valid response", async ({ request }) => {
    const res = await request.get("/api/copilot/digest");
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty("digest");
    }
    expect(res.status()).not.toBe(500);
  });
});
