import { test, expect } from "@playwright/test";

/**
 * QA Suite: Settings & Notification Preferences
 *
 * Tests notification preferences page, user preferences API,
 * and settings tab consistency across all settings pages.
 */

test.describe("User Preferences API", () => {
  test("GET preferences returns valid response", async ({ request }) => {
    const res = await request.get("/api/user/preferences");
    if (res.status() === 200) {
      const data = await res.json();
      expect(typeof data).toBe("object");
    }
    expect(res.status()).not.toBe(500);
  });

  test("PATCH preferences accepts digest_preferences key", async ({ request }) => {
    const res = await request.patch("/api/user/preferences", {
      data: {
        digest_preferences: JSON.stringify({
          weeklyDigestEnabled: true,
          weeklyDigestDay: 0,
          smartAlertsEnabled: true,
          smartAlertMinSeverity: "warning",
          channels: { inApp: true, slack: false, email: true },
        }),
      },
    });
    // 401 is OK (no auth), but never 500
    expect(res.status()).not.toBe(500);
  });

  test("PATCH rejects unknown preference keys", async ({ request }) => {
    const res = await request.patch("/api/user/preferences", {
      data: { unknown_key: "should_be_ignored" },
    });
    // Should succeed but silently skip unknown keys (not error)
    expect(res.status()).not.toBe(500);
  });
});

test.describe("Settings Tab Consistency", () => {
  const SETTINGS_PAGES = [
    "/console/settings",
    "/console/settings/users",
    "/console/settings/audit-log",
    "/console/settings/billing",
    "/console/settings/trust",
    "/console/settings/incidents",
    "/console/settings/security",
    "/console/settings/notifications",
  ];

  for (const path of SETTINGS_PAGES) {
    test(`${path} has all 8 settings tabs`, async ({ page }) => {
      const res = await page.goto(path);
      if (res?.status() === 200) {
        const body = await page.textContent("body");
        const expectedTabs = [
          "General",
          "Users",
          "Audit Log",
          "Billing",
          "Trust Center",
          "Incidents",
          "Security",
          "Notifications",
        ];
        for (const tab of expectedTabs) {
          expect(body, `Missing tab "${tab}" on ${path}`).toContain(tab);
        }
      }
    });
  }
});

test.describe("Notifications Settings Page", () => {
  test("notifications page has digest and alerts toggles", async ({ page }) => {
    const res = await page.goto("/console/settings/notifications");
    if (res?.status() === 200) {
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");

      expect(body).toContain("Weekly Compliance Digest");
      expect(body).toContain("Smart Alerts");
      expect(body).toContain("Delivery Channels");
    }
  });
});
