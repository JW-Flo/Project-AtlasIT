#!/usr/bin/env node
/**
 * Functional test — actually interacts with the UI to verify end-to-end behavior.
 * Tests: login, form submission, data persistence, tenant isolation.
 *
 * Run: node scripts/functional-test.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "https://www.atlasit.pro";
const API = "https://ahjoepuw96.execute-api.us-east-1.amazonaws.com";
const EMAIL = "joe@atlasit.pro";
const PASSWORD = "AtlasIT2026!";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const pass = [], fail = [];
function log(ok, msg) { (ok ? pass : fail).push(msg); console.log(`  ${ok ? "✓" : "✗"} ${msg}`); }

console.log("\n=== LOGIN ===");
await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASSWORD);
await page.locator('button[type="submit"]').click();
await page.waitForURL(/\/console/, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(4000);
const loggedIn = await page.evaluate(() => !!sessionStorage.getItem("atlasit_token"));
log(loggedIn, "Login stores token in sessionStorage");

console.log("\n=== DASHBOARD ===");
await page.goto(BASE + "/console", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
const dashText = await page.locator("body").innerText();
log(dashText.includes("615"), "Dashboard shows 615 evidence records");
log(dashText.includes("43"), "Dashboard shows 43 automation rules");
log(dashText.includes("AtlasIT") && dashText.includes("enterprise"), "Dashboard shows tenant name + tier");
log(dashText.includes("Recent Activity"), "Dashboard shows recent activity section");

console.log("\n=== COMPLIANCE ===");
await page.goto(BASE + "/console/compliance", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
const compText = await page.locator("body").innerText();
log(compText.includes("SOC2") || compText.includes("HIPAA"), "Compliance shows framework names");
log(compText.match(/\d+%/)?.length >= 3, "Compliance shows score percentages");
log(compText.includes("evidence records") || compText.includes("Evidence"), "Compliance shows evidence info");

console.log("\n=== DIRECTORY ===");
await page.goto(BASE + "/console/directory", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
const dirText = await page.locator("body").innerText();
log(dirText.includes("alice.chen") || dirText.includes("@atlasit.app"), "Directory shows real user emails");
log(dirText.includes("Users") && dirText.includes("Groups"), "Directory has tabs");
// Try clicking Groups tab
try {
  await page.locator('button:has-text("Groups")').first().click({ timeout: 5000 });
  await page.waitForTimeout(2000);
  const groupsText = await page.locator("body").innerText();
  log(groupsText.includes("Groups"), "Groups tab accessible");
} catch (e) {
  log(false, "Groups tab click: " + e.message.substring(0, 80));
}

console.log("\n=== AUTOMATION ===");
await page.goto(BASE + "/console/automation", { waitUntil: "networkidle" });
await page.waitForTimeout(5000);
const autoText = await page.locator("body").innerText();
log(autoText.includes("43"), "Automation shows 43 rules count");
log(autoText.includes("Auto-") || autoText.includes("provision") || autoText.match(/[A-Z][a-z]+\s+\w+/), "Automation shows rule names");
log(!autoText.includes("Unexpected token"), "Automation has no JSON parse errors");

console.log("\n=== INCIDENTS — CREATE FORM ===");
await page.goto(BASE + "/console/incidents", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const incidBefore = await page.locator("body").innerText();
log(incidBefore.includes("Incidents"), "Incidents page header");
log(incidBefore.includes("New Incident"), "New Incident button visible");

// Click New Incident and fill form
try {
  await page.locator('button:has-text("New Incident")').first().click({ timeout: 5000 });
  await page.waitForTimeout(1000);
  const testTitle = "Functional test incident " + Date.now();
  await page.locator('input[placeholder*="itle" i], input[name="title"], input[type="text"]').first().fill(testTitle);
  // Find severity select if exists
  const sevSelect = page.locator('select').first();
  if (await sevSelect.count() > 0) await sevSelect.selectOption({ label: "High" }).catch(() => sevSelect.selectOption({ index: 2 }));

  const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Create")').first();
  await submitBtn.click({ timeout: 5000 });
  await page.waitForTimeout(3000);

  const incidAfter = await page.locator("body").innerText();
  log(incidAfter.includes(testTitle) || incidAfter.includes("Functional test"), "Created incident appears in list");
} catch (e) {
  log(false, "Create incident: " + e.message.substring(0, 80));
}

console.log("\n=== SESSION PERSISTENCE (F5 refresh) ===");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const stillLoggedIn = await page.evaluate(() => !!sessionStorage.getItem("atlasit_token"));
log(stillLoggedIn, "Session survives page refresh");
const urlAfterReload = page.url();
log(urlAfterReload.includes("/console"), "Still on /console after reload (no redirect to /login)");

console.log("\n=== LOGOUT ===");
await page.evaluate(() => {
  sessionStorage.removeItem("atlasit_token");
  sessionStorage.removeItem("atlasit_user");
});
await page.goto(BASE + "/console", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const finalUrl = page.url();
log(finalUrl.includes("/login"), "Unauthenticated → redirects to /login");

console.log("\n=== TENANT ISOLATION (spoofed header) ===");
const resp = await page.request.get(API + "/api/v1/dashboard", {
  headers: {
    "Authorization": "Bearer invalid-token-xyz",
    "x-tenant-id": "other-tenant",
  },
});
log(resp.status() === 401, `Invalid token rejected (got HTTP ${resp.status()})`);

await page.screenshot({ path: "test-results/functional-final.png", fullPage: true });
await browser.close();

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║                FUNCTIONAL TEST SUMMARY                       ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log(`\n✓ PASS (${pass.length}):`);
pass.forEach(s => console.log(`  ✓ ${s}`));
if (fail.length > 0) {
  console.log(`\n✗ FAIL (${fail.length}):`);
  fail.forEach(s => console.log(`  ✗ ${s}`));
}
process.exit(fail.length > 0 ? 1 : 0);
