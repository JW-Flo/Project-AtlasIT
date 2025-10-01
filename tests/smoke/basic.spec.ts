import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("root responds", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(500);
  });

  test("auth endpoints (login/register noop) behave", async ({ request }) => {
    const login = await request.post("/api/v1/auth", {
      data: { action: "login" },
    });
    expect(login.status(), "login should return 200").toBe(200);
    const register = await request.post("/api/v1/auth", {
      data: { action: "register" },
    });
    expect(register.status(), "register should return 200").toBe(200);
    const invalid = await request.post("/api/v1/auth", {
      data: { action: "noop" },
    });
    expect(invalid.status(), "invalid should return 400").toBe(400);
  });
});
