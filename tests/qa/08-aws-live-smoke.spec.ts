/**
 * Live smoke test against the AWS production console.
 * Captures real browser behavior: console errors, network failures, visual state.
 *
 * Run: npx playwright test tests/qa/08-aws-live-smoke.spec.ts --project=chromium
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "https://www.atlasit.pro";
const API_URL = "https://ahjoepuw96.execute-api.us-east-1.amazonaws.com";
const TEST_EMAIL = "joe@atlasit.pro";
const TEST_PASSWORD = "AtlasIT2026!";

interface CapturedErrors {
  consoleErrors: string[];
  consoleWarnings: string[];
  pageErrors: string[];
  failedRequests: Array<{ url: string; status: number; method: string }>;
}

function attachCapture(page: import("@playwright/test").Page): CapturedErrors {
  const capture: CapturedErrors = {
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") capture.consoleErrors.push(msg.text());
    if (msg.type() === "warning") capture.consoleWarnings.push(msg.text());
  });

  page.on("pageerror", (err) => {
    capture.pageErrors.push(err.message);
  });

  page.on("response", (res) => {
    if (res.status() >= 400) {
      capture.failedRequests.push({
        url: res.url(),
        status: res.status(),
        method: res.request().method(),
      });
    }
  });

  return capture;
}

test.describe("AWS Live Console Smoke", () => {
  test.setTimeout(90_000);

  test("Root / redirects to /login (unauthenticated)", async ({ page }) => {
    const cap = attachCapture(page);
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log("Final URL:", finalUrl);
    console.log("Console errors:", cap.consoleErrors.length);
    cap.consoleErrors.forEach((e) => console.log("  ERROR:", e));
    console.log("Page errors:", cap.pageErrors.length);
    cap.pageErrors.forEach((e) => console.log("  PAGE-ERROR:", e));
    console.log("Failed requests:");
    cap.failedRequests.forEach((r) => console.log(`  ${r.status} ${r.method} ${r.url}`));

    await page.screenshot({ path: "test-results/01-root-redirect.png", fullPage: true });

    expect(finalUrl).toContain("/login");
  });

  test("Login page renders with form", async ({ page }) => {
    const cap = attachCapture(page);
    await page.goto(BASE_URL + "/login", { waitUntil: "networkidle" });

    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailField).toBeVisible({ timeout: 10_000 });
    await expect(passwordField).toBeVisible();
    await expect(submitBtn).toBeVisible();

    console.log("Login page console errors:", cap.consoleErrors);
    console.log("Login page failed requests:", cap.failedRequests);

    await page.screenshot({ path: "test-results/02-login-page.png", fullPage: true });
  });

  test("Login submit with valid credentials → redirects to /console", async ({ page }) => {
    const cap = attachCapture(page);
    await page.goto(BASE_URL + "/login", { waitUntil: "networkidle" });

    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.screenshot({ path: "test-results/03-login-filled.png" });

    const loginReqPromise = page.waitForResponse(
      (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST",
      { timeout: 30_000 },
    );

    await page.locator('button[type="submit"]').click();

    const loginRes = await loginReqPromise;
    console.log("Auth response status:", loginRes.status());
    const loginBody = await loginRes.json().catch(() => null);
    console.log("Auth response body:", JSON.stringify(loginBody).substring(0, 200));

    await page.waitForURL(/\/console/, { timeout: 15_000 }).catch(() => {});
    await page.screenshot({ path: "test-results/04-post-login.png", fullPage: true });

    const finalUrl = page.url();
    console.log("Post-login URL:", finalUrl);
    console.log("Post-login console errors:");
    cap.consoleErrors.forEach((e) => console.log("  ", e));
    console.log("Post-login failed requests:");
    cap.failedRequests.forEach((r) => console.log(`  ${r.status} ${r.method} ${r.url}`));

    expect(loginRes.status()).toBe(200);
    expect(finalUrl).toContain("/console");
  });

  test("Post-login: /console page loads with data", async ({ page }) => {
    const cap = attachCapture(page);

    // Login first
    await page.goto(BASE_URL + "/login", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/console/, { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log("Navigated to:", currentUrl);

    // Capture what the page actually shows
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    console.log("Page body text (first 500 chars):");
    console.log(bodyText.substring(0, 500));

    console.log("Console errors on /console:");
    cap.consoleErrors.forEach((e) => console.log("  ", e));
    console.log("Failed requests on /console:");
    cap.failedRequests.forEach((r) => console.log(`  ${r.status} ${r.method} ${r.url}`));

    await page.screenshot({ path: "test-results/05-console-page.png", fullPage: true });
  });

  test("Navigation attempts: can we reach Compliance, Directory, Automation?", async ({ page }) => {
    const cap = attachCapture(page);

    // Login
    await page.goto(BASE_URL + "/login", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);

    const pagesToTest = [
      "/console/compliance",
      "/console/directory",
      "/console/automation",
      "/console/incidents",
      "/console/apps",
    ];

    for (const path of pagesToTest) {
      cap.consoleErrors.length = 0;
      cap.failedRequests.length = 0;
      await page.goto(BASE_URL + path, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(2000);
      const bodyText = await page
        .locator("body")
        .innerText()
        .catch(() => "");
      const hasContent = bodyText.length > 100;
      console.log(`\n=== ${path} ===`);
      console.log(`  URL: ${page.url()}`);
      console.log(`  Body length: ${bodyText.length} chars`);
      console.log(`  Has content: ${hasContent}`);
      console.log(`  Console errors: ${cap.consoleErrors.length}`);
      cap.consoleErrors.slice(0, 3).forEach((e) => console.log(`    ${e.substring(0, 150)}`));
      console.log(`  Failed requests: ${cap.failedRequests.length}`);
      cap.failedRequests
        .slice(0, 3)
        .forEach((r) => console.log(`    ${r.status} ${r.url.substring(0, 100)}`));
      await page.screenshot({
        path: `test-results/nav-${path.replace(/\//g, "_")}.png`,
        fullPage: true,
      });
    }
  });
});
