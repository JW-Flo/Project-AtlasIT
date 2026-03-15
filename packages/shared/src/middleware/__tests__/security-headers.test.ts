import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { securityHeadersMiddleware } from "../security-headers";

describe("securityHeadersMiddleware", () => {
  it("sets production security headers", async () => {
    const app = new Hono();
    app.use("*", securityHeadersMiddleware());
    app.get("/", (c) => c.json({ ok: true }));

    const response = await app.request("/");

    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age=",
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
