import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { rateLimitMiddleware } from "../rate-limit";

class MockKvNamespace {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
}

describe("rateLimitMiddleware", () => {
  it("enforces per-tenant per-endpoint limits", async () => {
    const app = new Hono<{ Bindings: { RATE_LIMIT_KV: MockKvNamespace } }>();

    app.use(
      "*",
      rateLimitMiddleware({
        defaultLimit: 2,
        windowSeconds: 60,
      }),
    );

    app.onError((err, c) => c.json({ error: err.message }, 429));
    app.get("/api/v1/items", (c) => c.json({ status: "success" as const }));

    const env = { RATE_LIMIT_KV: new MockKvNamespace() };
    const req = () =>
      new Request("http://localhost/api/v1/items", {
        headers: { "X-Tenant-ID": "tenant-alpha" },
      });

    const first = await app.fetch(req(), env);
    const second = await app.fetch(req(), env);
    const third = await app.fetch(req(), env);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
  });
});
