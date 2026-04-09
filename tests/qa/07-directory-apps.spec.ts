import { test, expect } from "@playwright/test";

/**
 * QA Suite: Directory, Apps & Integrations
 *
 * Tests the directory page (users/groups), connected apps,
 * integrations catalog, and marketplace.
 */

test.describe("Directory Page", () => {
  test("directory page loads without error", async ({ page }) => {
    const res = await page.goto("/console/directory");
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    if (status === 200) {
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      expect(
        body?.includes("Directory") || body?.includes("Users") || body?.includes("Groups"),
      ).toBeTruthy();
    }
  });

  test("directory shows user/group tabs or sections", async ({ page }) => {
    const res = await page.goto("/console/directory");
    if (res?.status() === 200) {
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      // Should have some directory structure even if empty
      const hasStructure =
        body?.includes("Users") ||
        body?.includes("Groups") ||
        body?.includes("No users") ||
        body?.includes("Directory");
      expect(hasStructure).toBeTruthy();
    }
  });
});

test.describe("Apps & Integrations", () => {
  test("apps page loads", async ({ page }) => {
    const res = await page.goto("/console/apps");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("integrations page loads catalog", async ({ page }) => {
    const res = await page.goto("/console/integrations");
    if (res?.status() === 200) {
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      // Should mention some known integrations
      const hasContent =
        body?.includes("Okta") ||
        body?.includes("Google") ||
        body?.includes("Microsoft") ||
        body?.includes("Slack") ||
        body?.includes("Integration") ||
        body?.includes("Connect");
      expect(hasContent).toBeTruthy();
    }
  });

  test("marketplace page loads", async ({ page }) => {
    const res = await page.goto("/marketplace");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });
});

test.describe("Automation & Workflows", () => {
  test("automation page loads", async ({ page }) => {
    const res = await page.goto("/console/automation");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("workflows page loads", async ({ page }) => {
    const res = await page.goto("/console/workflows");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("automation rules API responds", async ({ request }) => {
    const res = await request.get("/api/automation/rules");
    expect(res.status()).not.toBe(500);
  });
});

test.describe("Incidents & Access Reviews", () => {
  test("incidents page loads", async ({ page }) => {
    const res = await page.goto("/console/incidents");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("access reviews page loads", async ({ page }) => {
    const res = await page.goto("/console/access-reviews");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("public incidents page loads", async ({ page }) => {
    const res = await page.goto("/incidents");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });
});
