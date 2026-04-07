import { test, expect } from "@playwright/test";
import { scanA11y } from "../utils/a11y.js";

/**
 * QA Suite: Console Page Navigation
 *
 * Verifies every console route loads without 500 errors,
 * renders expected content, and passes basic a11y checks.
 */

// All console routes that should be accessible
const CONSOLE_ROUTES = [
  { path: "/console", name: "Dashboard" },
  { path: "/console/compliance", name: "Compliance" },
  { path: "/console/compliance/feed", name: "Compliance Feed" },
  { path: "/console/compliance/packs", name: "Compliance Packs" },
  { path: "/console/compliance/attestations", name: "Attestations" },
  { path: "/console/policies", name: "Policies" },
  { path: "/console/directory", name: "Directory" },
  { path: "/console/automation", name: "Automation" },
  { path: "/console/workflows", name: "Workflows" },
  { path: "/console/incidents", name: "Incidents" },
  { path: "/console/apps", name: "Apps" },
  { path: "/console/integrations", name: "Integrations" },
  { path: "/console/analytics", name: "Analytics" },
  { path: "/console/insights", name: "Insights" },
  { path: "/console/discovery", name: "Discovery" },
  { path: "/console/nhi", name: "NHI" },
  { path: "/console/access-reviews", name: "Access Reviews" },
  { path: "/console/platform-status", name: "Platform Status" },
  { path: "/console/profile", name: "Profile" },
  { path: "/console/admin", name: "Admin" },
  { path: "/console/onboarding", name: "Onboarding" },
];

const SETTINGS_ROUTES = [
  { path: "/console/settings", name: "Settings General" },
  { path: "/console/settings/users", name: "Settings Users" },
  { path: "/console/settings/audit-log", name: "Settings Audit Log" },
  { path: "/console/settings/billing", name: "Settings Billing" },
  { path: "/console/settings/trust", name: "Settings Trust" },
  { path: "/console/settings/incidents", name: "Settings Incidents" },
  { path: "/console/settings/security", name: "Settings Security" },
  { path: "/console/settings/notifications", name: "Settings Notifications" },
];

test.describe("Console Navigation", () => {
  for (const route of [...CONSOLE_ROUTES, ...SETTINGS_ROUTES]) {
    test(`${route.name} (${route.path}) loads without 500`, async ({ page }) => {
      const res = await page.goto(route.path);
      const status = res?.status() ?? 0;
      // Accept 200, 302 (redirect to login), 401 — but never 500
      expect(status, `${route.path} returned ${status}`).toBeLessThan(500);
    });
  }
});

test.describe("Console Page Content", () => {
  test("dashboard has expected widgets", async ({ page }) => {
    const res = await page.goto("/console");
    if (res?.status() === 200) {
      // Should have some content — heading or cards
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });

  test("compliance page shows framework tabs", async ({ page }) => {
    const res = await page.goto("/console/compliance");
    if (res?.status() === 200) {
      // Should have framework navigation or score display
      const content = await page.textContent("body");
      const hasFramework =
        content?.includes("SOC") ||
        content?.includes("ISO") ||
        content?.includes("NIST") ||
        content?.includes("HIPAA") ||
        content?.includes("GDPR") ||
        content?.includes("Compliance");
      expect(hasFramework).toBeTruthy();
    }
  });

  test("policies page has generate button", async ({ page }) => {
    const res = await page.goto("/console/policies");
    if (res?.status() === 200) {
      const generateBtn = page.getByRole("button", { name: /generate/i });
      await expect(generateBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test("settings pages have consistent tab navigation", async ({ page }) => {
    const res = await page.goto("/console/settings");
    if (res?.status() === 200) {
      // Should have settings tabs including Notifications
      const content = await page.textContent("body");
      expect(content).toContain("Notifications");
      expect(content).toContain("General");
      expect(content).toContain("Security");
    }
  });
});

test.describe("Console Accessibility", () => {
  const a11yRoutes = ["/console", "/console/compliance", "/console/policies", "/console/settings"];

  for (const route of a11yRoutes) {
    test(`a11y scan: ${route}`, async ({ page }) => {
      const res = await page.goto(route);
      if (res?.status() === 200) {
        await scanA11y(page, route.replace(/\//g, "_"));
      }
    });
  }
});
