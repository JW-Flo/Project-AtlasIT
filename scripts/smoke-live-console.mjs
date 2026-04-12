#!/usr/bin/env node
/**
 * Live smoke test against production AWS console.
 * Uses playwright core (no test framework) to avoid version conflicts.
 *
 * Run: node scripts/smoke-live-console.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE_URL = "https://www.atlasit.pro";
const TEST_EMAIL = "joe@atlasit.pro";
const TEST_PASSWORD = "AtlasIT2026!";

await mkdir("test-results", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const results = { pass: [], fail: [], warnings: [] };
const issues = [];

function attachCapture(page, label) {
  const cap = { errors: [], pageErrors: [], failed: [], allRequests: [] };
  page.on("console", (m) => { if (m.type() === "error") cap.errors.push(m.text()); });
  page.on("pageerror", (e) => cap.pageErrors.push(`${e.message}\n  Stack: ${e.stack?.split("\n")[1]?.trim() ?? ""}`));
  page.on("request", (r) => {
    // Capture ALL requests to understand what's happening
    const url = r.url();
    if (!url.endsWith(".js") && !url.includes(".css") && !url.endsWith(".png") && !url.endsWith(".ico") && !url.endsWith(".woff") && !url.endsWith(".woff2")) {
      cap.allRequests.push(`${r.method()} ${url}`);
    }
  });
  page.on("response", (r) => {
    if (r.status() >= 400) cap.failed.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  return cap;
}

function printCapture(label, cap) {
  console.log(`\n━━━ ${label} ━━━`);
  console.log(`API requests (${cap.allRequests.length}):`);
  cap.allRequests.slice(0, 15).forEach((r) => console.log(`  ${r.substring(0, 160)}`));
  console.log(`Console errors: ${cap.errors.length}`);
  cap.errors.slice(0, 5).forEach((e) => console.log(`  ERR: ${e.substring(0, 250)}`));
  console.log(`Page errors: ${cap.pageErrors.length}`);
  cap.pageErrors.slice(0, 5).forEach((e) => console.log(`  PAGE: ${e.substring(0, 300)}`));
  console.log(`Failed requests: ${cap.failed.length}`);
  cap.failed.slice(0, 10).forEach((r) => console.log(`  ${r.substring(0, 150)}`));
  if (cap.errors.length || cap.pageErrors.length || cap.failed.length > 0) {
    issues.push({ label, errors: cap.errors.length, pageErrors: cap.pageErrors.length, failed: cap.failed.length });
  }
}

// Test 1: Root redirects
console.log("\n=== TEST 1: Root / redirect ===");
let cap = attachCapture(page);
await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const url1 = page.url();
console.log(`Final URL: ${url1}`);
await page.screenshot({ path: "test-results/01-root.png", fullPage: true });
printCapture("Root /", cap);
if (url1.includes("/login")) results.pass.push("Root redirects to /login");
else results.fail.push(`Root did not redirect (stayed at ${url1})`);

// Test 2: Login page renders
console.log("\n=== TEST 2: Login page ===");
cap = attachCapture(page);
await page.goto(BASE_URL + "/login", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const emailVisible = await page.locator('input[type="email"]').isVisible().catch(() => false);
const pwdVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
const btnVisible = await page.locator('button[type="submit"]').isVisible().catch(() => false);
await page.screenshot({ path: "test-results/02-login.png", fullPage: true });
printCapture("/login", cap);
if (emailVisible && pwdVisible && btnVisible) results.pass.push("Login form renders");
else results.fail.push(`Login form missing: email=${emailVisible} pwd=${pwdVisible} btn=${btnVisible}`);

// Test 3: Login submission
console.log("\n=== TEST 3: Login submit ===");
cap = attachCapture(page);
await page.locator('input[type="email"]').fill(TEST_EMAIL);
await page.locator('input[type="password"]').fill(TEST_PASSWORD);
const tokenPromise = page.waitForResponse((r) => r.url().includes("/auth/token") && r.request().method() === "POST", { timeout: 30000 }).catch(() => null);
await page.locator('button[type="submit"]').click();
const tokenRes = await tokenPromise;
if (tokenRes) {
  console.log(`Auth status: ${tokenRes.status()}`);
  const body = await tokenRes.json().catch(() => null);
  if (body?.token) results.pass.push(`Login succeeded (token: ${body.token.substring(0, 12)}...)`);
  else results.fail.push(`Auth returned ${tokenRes.status()} but no token: ${JSON.stringify(body).substring(0, 100)}`);
} else {
  results.fail.push("Auth request never fired");
}
await page.waitForTimeout(5000);
const urlAfterLogin = page.url();
console.log(`URL after login: ${urlAfterLogin}`);
await page.screenshot({ path: "test-results/03-post-login.png", fullPage: true });
printCapture("Post-login", cap);

// Test 4: /console page
console.log("\n=== TEST 4: /console page ===");
cap = attachCapture(page);
if (!urlAfterLogin.includes("/console")) {
  await page.goto(BASE_URL + "/console", { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(4000);
}
const consoleBody = await page.locator("body").innerText().catch(() => "");
console.log(`Body length: ${consoleBody.length} chars`);
console.log(`Preview: ${consoleBody.substring(0, 300).replace(/\n/g, " | ")}`);
await page.screenshot({ path: "test-results/04-console.png", fullPage: true });
printCapture("/console", cap);
if (consoleBody.length > 500 && !consoleBody.includes("Sign in")) {
  results.pass.push(`/console renders content (${consoleBody.length} chars)`);
} else {
  results.fail.push(`/console shows little content (${consoleBody.length} chars)`);
}

// Test 5: Key navigation paths
console.log("\n=== TEST 5: Key pages ===");
const navPaths = [
  "/console/compliance",
  "/console/directory",
  "/console/automation",
  "/console/incidents",
  "/console/apps",
];
for (const path of navPaths) {
  cap = attachCapture(page);
  try {
    await page.goto(BASE_URL + path, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText().catch(() => "");
    const safeName = path.replace(/\//g, "_");
    await page.screenshot({ path: `test-results/nav${safeName}.png`, fullPage: true });
    console.log(`\n  ${path}: ${body.length} chars, ${cap.errors.length} console errors, ${cap.failed.length} failed requests`);
    if (cap.errors.length > 0) {
      cap.errors.slice(0, 2).forEach((e) => console.log(`    ERR: ${e.substring(0, 150)}`));
    }
    if (body.length > 300) results.pass.push(`${path} renders (${body.length} chars)`);
    else results.warnings.push(`${path} shows minimal content (${body.length} chars)`);
  } catch (e) {
    results.fail.push(`${path} failed: ${e.message.substring(0, 100)}`);
  }
}

await browser.close();

// Final report
console.log("\n\n╔══════════════════════════════════════════════════════════════╗");
console.log("║                    SMOKE TEST RESULTS                       ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log(`\n✓ PASS (${results.pass.length}):`);
results.pass.forEach((s) => console.log(`  ✓ ${s}`));
console.log(`\n✗ FAIL (${results.fail.length}):`);
results.fail.forEach((s) => console.log(`  ✗ ${s}`));
console.log(`\n⚠ WARNINGS (${results.warnings.length}):`);
results.warnings.forEach((s) => console.log(`  ⚠ ${s}`));
console.log(`\n📊 Issues by page:`);
issues.forEach((i) => console.log(`  ${i.label}: ${i.errors} console errors, ${i.pageErrors} page errors, ${i.failed} failed requests`));

console.log(`\nScreenshots saved to test-results/`);

process.exit(results.fail.length > 0 ? 1 : 0);
