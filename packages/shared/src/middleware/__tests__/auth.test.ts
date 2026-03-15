import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { authMiddleware } from "../auth";

describe("authMiddleware", () => {
  function createApp(env: Record<string, string> = {}) {
    const app = new Hono<{ Bindings: Record<string, string> }>();

    // Error handler to convert AuthErrors to JSON responses
    app.onError((err, c) => {
      const status = "status" in err ? (err as any).status : 500;
      return c.json({ status: "error", message: err.message }, status as any);
    });

    app.use("*", authMiddleware({ allowApiKey: true }));

    app.get("/test", (c) => {
      const auth = c.get("auth");
      const tenantId = c.get("tenantId");
      return c.json({ auth, tenantId });
    });

    return { app, env };
  }

  it("should throw 401 when no auth header is present", async () => {
    const { app } = createApp({ API_ALLOWED_KEYS: "key-1,key-2" });
    const res = await app.request(
      "/test",
      {},
      { API_ALLOWED_KEYS: "key-1,key-2" },
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Missing or invalid authentication");
  });

  it("should throw 401 for invalid API key", async () => {
    const { app } = createApp();
    const res = await app.request(
      "/test",
      { headers: { "X-API-Key": "invalid-key" } },
      { API_ALLOWED_KEYS: "valid-key-1,valid-key-2" },
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Missing or invalid authentication");
  });

  it("should accept valid API key when API_ALLOWED_KEYS is configured", async () => {
    const { app } = createApp();
    const res = await app.request(
      "/test",
      { headers: { "X-API-Key": "valid-key-1" } },
      { API_ALLOWED_KEYS: "valid-key-1,valid-key-2" },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.auth).toBeDefined();
    expect(body.auth.tokenType).toBe("api-key");
  });

  it("should set auth context on valid API key", async () => {
    const { app } = createApp();
    const res = await app.request(
      "/test",
      { headers: { "X-API-Key": "valid-key-1" } },
      { API_ALLOWED_KEYS: "valid-key-1" },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.auth.tokenType).toBe("api-key");
    expect(body.auth.roles).toEqual(["api-key"]);
    expect(body.auth.userId).toBe("");
    expect(body.auth.email).toBe("");
  });

  it("should set tenantId from X-Tenant-ID header with API key auth", async () => {
    const { app } = createApp();
    const res = await app.request(
      "/test",
      {
        headers: {
          "X-API-Key": "valid-key-1",
          "X-Tenant-ID": "tenant-abc",
        },
      },
      { API_ALLOWED_KEYS: "valid-key-1" },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.auth.tenantId).toBe("tenant-abc");
    expect(body.tenantId).toBe("tenant-abc");
  });

  it("should default tenantId to 'default' when X-Tenant-ID is not provided", async () => {
    const { app } = createApp();
    const res = await app.request(
      "/test",
      { headers: { "X-API-Key": "valid-key-1" } },
      { API_ALLOWED_KEYS: "valid-key-1" },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.auth.tenantId).toBe("default");
    expect(body.tenantId).toBe("default");
  });

  it("should throw 401 when API_ALLOWED_KEYS is empty and API key is provided", async () => {
    const { app } = createApp();
    const res = await app.request(
      "/test",
      { headers: { "X-API-Key": "some-key" } },
      { API_ALLOWED_KEYS: "" },
    );

    expect(res.status).toBe(401);
  });
});
