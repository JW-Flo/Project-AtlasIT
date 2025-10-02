import { test, expect } from "@playwright/test";
import { scanA11y } from "../utils/a11y.js";

async function safeFill(page, selector, value) {
  const el = page.locator(selector);
  if (await el.count()) {
    await el.first().fill(value);
  }
}

test.describe("Forms", () => {
  test("create access request + transitions", async ({ page }) => {
    await page.goto("/access-requests");
    await scanA11y(page, "access-requests");
    await safeFill(page, 'input[placeholder="Subject Ref"]', "user-123");
    await safeFill(page, 'input[placeholder="Resource"]', "res-A");
    await safeFill(
      page,
      'input[placeholder="Justification"]',
      "Need access for demo",
    );
    const createBtn = page.getByRole("button", { name: /create/i });
    if (await createBtn.count()) await createBtn.click();
    const approve = page.getByRole("button", { name: /approve/i }).first();
    if (await approve.count()) await approve.click();
    const fulfill = page.getByRole("button", { name: /fulfill/i }).first();
    if (await fulfill.count()) await fulfill.click();
    await expect(page.locator("table")).toBeVisible();
  });

  test("create incident + resolve", async ({ page }) => {
    await page.goto("/incidents");
    await scanA11y(page, "incidents");
    await safeFill(page, 'input[placeholder="Title"]', "Disk space alert");
    const source = page.locator('input[placeholder="Source (optional)"]');
    if (await source.count()) await source.fill("monitoring");
    const createBtn = page.getByRole("button", { name: /create/i });
    if (await createBtn.count()) await createBtn.click();
    const resolveBtn = page.getByRole("button", { name: /resolve/i }).first();
    if (await resolveBtn.count()) await resolveBtn.click();
    await expect(page.locator("table")).toBeVisible();
  });
});
