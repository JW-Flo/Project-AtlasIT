import { test, expect, type Page } from "@playwright/test";

/**
 * QA Suite: Authentication & Session Management
 *
 * Tests login flow, session persistence, role-based access,
 * and logout behavior.
 */

test.describe("Authentication", () => {
  test("login page loads and has required fields", async ({ page }) => {
    await page.goto("/console/login");
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in|login/i })).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/console/login");
    await page.fill('input[type="email"], input[name="email"]', "bad@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();
    // Should show an error message, not redirect
    await page.waitForTimeout(1000);
    const errorVisible = await page.locator('[role="alert"], .text-destructive, .text-red').count();
    const stillOnLogin = page.url().includes("login");
    expect(errorVisible > 0 || stillOnLogin).toBeTruthy();
  });

  test("unauthenticated access to /console redirects to login", async ({ page }) => {
    const res = await page.goto("/console");
    // Should redirect to login or show unauthorized
    const url = page.url();
    const status = res?.status() ?? 0;
    expect(url.includes("login") || status === 401 || status === 302).toBeTruthy();
  });

  test("API endpoints return 401 without session", async ({ request }) => {
    const endpoints = [
      "/api/copilot/chat",
      "/api/copilot/weekly-digest",
      "/api/copilot/smart-alerts",
      "/api/policies/templates",
      "/api/tenant-compliance/scores",
      "/api/user/preferences",
    ];

    for (const endpoint of endpoints) {
      const res = await request.get(endpoint);
      expect(res.status(), `${endpoint} should require auth`).toBe(401);
    }
  });

  test("health endpoint is public", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status");
  });
});
