import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { correlationId } from "../correlation";
describe("correlationId middleware", () => {
  function createApp() {
    const app = new Hono();
    app.use("*", correlationId());
    app.get("/test", (c) => {
      return c.json({ correlationId: c.get("correlationId") });
    });
    return app;
  }
  it("should generate a UUID correlationId when no header is present", async () => {
    const app = createApp();
    const res = await app.request("/test");
    const body = await res.json();
    expect(body.correlationId).toBeDefined();
    expect(typeof body.correlationId).toBe("string");
    // UUID v4 format
    expect(body.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
  it("should use existing X-Correlation-ID header when present", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { "X-Correlation-ID": "my-custom-id-123" },
    });
    const body = await res.json();
    expect(body.correlationId).toBe("my-custom-id-123");
  });
  it("should set X-Correlation-ID on response", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { "X-Correlation-ID": "response-header-test" },
    });
    expect(res.headers.get("X-Correlation-ID")).toBe("response-header-test");
  });
  it("should set X-Correlation-ID on response when auto-generated", async () => {
    const app = createApp();
    const res = await app.request("/test");
    const body = await res.json();
    const headerValue = res.headers.get("X-Correlation-ID");
    expect(headerValue).toBeDefined();
    expect(headerValue).toBe(body.correlationId);
  });
  it("should set correlationId on context variable", async () => {
    const app = new Hono();
    app.use("*", correlationId());
    let capturedId;
    app.get("/test", (c) => {
      capturedId = c.get("correlationId");
      return c.json({ ok: true });
    });
    await app.request("/test", {
      headers: { "X-Correlation-ID": "ctx-var-test" },
    });
    expect(capturedId).toBe("ctx-var-test");
  });
});
//# sourceMappingURL=correlation.test.js.map
