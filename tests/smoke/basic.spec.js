// Basic Playwright smoke tests (JS to avoid TS project parser conflicts)
const { test, expect } = require("@playwright/test");

test.describe("Smoke", () => {
  test("root responds", async ({ page }) => {
    const res = await page.goto("/");
    expect(res && res.status()).toBeLessThan(500);
  });

  test("auth endpoints behave", async ({ request }) => {
    const login = await request.post("/api/v1/auth", {
      data: { action: "login" },
    });
    expect(login.status()).toBe(200);
    const register = await request.post("/api/v1/auth", {
      data: { action: "register" },
    });
    expect(register.status()).toBe(200);
    const invalid = await request.post("/api/v1/auth", {
      data: { action: "noop" },
    });
    expect(invalid.status()).toBe(400);
  });
});
