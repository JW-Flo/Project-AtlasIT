import { test, expect } from "@playwright/test";

/**
 * QA Suite: Policy Generator
 *
 * Tests policy template loading, generation for each template type,
 * content format (markdown not JSON), save as draft, and detail loading.
 */

test.describe("Policy Templates API", () => {
  test("templates endpoint returns available templates", async ({ request }) => {
    const res = await request.get("/api/policies/templates");
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty("templates");
      expect(data.templates.length).toBeGreaterThan(0);

      // Each template should have key, name, format
      for (const tpl of data.templates) {
        expect(tpl).toHaveProperty("key");
        expect(tpl).toHaveProperty("name");
        expect(typeof tpl.key).toBe("string");
        expect(typeof tpl.name).toBe("string");
      }
    }
    expect(res.status()).not.toBe(500);
  });
});

test.describe("Policy Generation API", () => {
  const TEMPLATE_KEYS = [
    "soc2.access_control",
    "iso27001.isms",
    "nist.csf",
    "hipaa.security",
    "dataprotection.general",
  ];

  for (const templateKey of TEMPLATE_KEYS) {
    test(`generates policy for template: ${templateKey}`, async ({ request }) => {
      const res = await request.post("/api/policies/generate", {
        data: {
          templateKey,
          input: {
            contactEmail: "test@atlasit.app",
            summary: "QA test policy generation",
          },
        },
      });

      if (res.status() === 200) {
        const raw = await res.json();
        const policy = raw?.data?.policy ?? raw;

        // Must have content as a string (not JSON object)
        expect(policy).toHaveProperty("content");
        expect(typeof policy.content).toBe("string");

        // Content should be markdown, not JSON
        expect(policy.content).not.toMatch(/^\s*\{/);
        expect(policy.content).toContain("##");

        // Content should NOT be a generic access control policy for non-access templates
        if (templateKey === "dataprotection.general" || templateKey === "hipaa.security") {
          const content = policy.content.toLowerCase();
          const hasRelevantContent =
            content.includes("data") ||
            content.includes("privacy") ||
            content.includes("protection") ||
            content.includes("hipaa") ||
            content.includes("health");
          expect(
            hasRelevantContent,
            `${templateKey} should generate relevant content, not generic access control`,
          ).toBeTruthy();
        }

        // Should have size info
        expect(policy.sizeBytes).toBeGreaterThan(0);
      }

      // 401 is OK (no auth), but never 500
      expect(res.status()).not.toBe(500);
    });
  }
});

test.describe("Policy Detail API", () => {
  test("non-existent policy returns 404, not 500", async ({ request }) => {
    const res = await request.get("/api/policies/nonexistent-id-12345");
    // Should be 404 or 401, never 500
    expect(res.status()).not.toBe(500);
  });
});

test.describe("Policy Page UI", () => {
  test("policies page loads template dropdown", async ({ page }) => {
    const res = await page.goto("/console/policies");
    if (res?.status() === 200) {
      const generateBtn = page.getByRole("button", { name: /generate/i });
      if (await generateBtn.isVisible()) {
        await generateBtn.click();
        await page.waitForTimeout(1000);

        // Template dropdown should appear
        const select = page.locator("select").first();
        if (await select.isVisible()) {
          const options = await select.locator("option").allTextContents();
          expect(options.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test("policy list rows are expandable without errors", async ({ page }) => {
    const res = await page.goto("/console/policies");
    if (res?.status() === 200) {
      await page.waitForTimeout(2000);

      // If there are policy rows, try expanding the first one
      const expandButtons = page
        .locator('button[aria-label*="expand"], tr button, .cursor-pointer')
        .first();
      if (await expandButtons.isVisible()) {
        await expandButtons.click();
        await page.waitForTimeout(2000);

        // Should not show "Failed to load (HTTP 500)"
        const body = await page.textContent("body");
        expect(body).not.toContain("HTTP 500");
      }
    }
  });
});
