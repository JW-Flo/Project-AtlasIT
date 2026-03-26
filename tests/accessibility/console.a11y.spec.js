// Basic accessibility scan for /console using axe
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Console accessibility", () => {
  test("console page has no critical a11y issues", async ({ page }) => {
    await page.goto("/console");
    // wait for main content
    await page.waitForSelector('h1:has-text("AtlasIT Console")');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const violations = accessibilityScanResults.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    );
    if (violations.length) {
      console.log(
        "Accessibility violations:",
        JSON.stringify(violations, null, 2),
      );
    }
    expect(violations).toHaveLength(0);
  });
});
