import { describe, expect, it, vi } from "vitest";
import { POST } from "../../../routes/api/demo/events/+server";

type QueryCall = { query: string; args: unknown[] };

function createRequest(body: Record<string, unknown>, headers?: Record<string, string>): Request {
  return new Request("https://example.com/api/demo/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  });
}

function createDb(options?: { failModuleInsert?: boolean }) {
  const calls: QueryCall[] = [];
  const failModuleInsert = options?.failModuleInsert ?? false;

  const db = {
    prepare: (query: string) => ({
      bind: (...args: unknown[]) => ({
        run: async () => {
          if (failModuleInsert && query.includes("(id, event_name, module, created_at)")) {
            throw new Error("module column missing");
          }
          calls.push({ query, args });
        },
      }),
    }),
  };

  return { db, calls };
}

describe("/api/demo/events POST", () => {
  it("no-ops when DEMO_MODE is disabled", async () => {
    const { db, calls } = createDb();
    const res = await POST({
      request: createRequest({ event: "viewed_demo" }),
      platform: { env: { DEMO_MODE: "false", ATLAS_SHARED_DB: db } },
    } as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, stored: false });
    expect(calls).toHaveLength(0);
  });

  it("stores module in dedicated module column when enabled", async () => {
    const { db, calls } = createDb();
    const res = await POST({
      request: createRequest({ event: "explored_module", module: "automation" }),
      platform: { env: { DEMO_MODE: "true", ATLAS_SHARED_DB: db } },
    } as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, stored: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.query).toContain("(id, event_name, module, created_at)");
    expect(calls[0]?.args[2]).toBe("automation");
  });

  it("applies lightweight KV rate limiting", async () => {
    const { db, calls } = createDb();
    const kv = {
      get: vi.fn(async () => "60"),
      put: vi.fn(async () => undefined),
    };

    const res = await POST({
      request: createRequest({ event: "viewed_demo" }, { "cf-connecting-ip": "203.0.113.10" }),
      platform: { env: { DEMO_MODE: "true", ATLAS_SHARED_DB: db, KV_CACHE: kv } },
    } as never);

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ ok: false, error: "rate_limited" });
    expect(kv.put).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it("falls back to legacy schema without writing module into invite_id", async () => {
    const { db, calls } = createDb({ failModuleInsert: true });
    const res = await POST({
      request: createRequest({ event: "explored_module", module: "identity" }),
      platform: { env: { DEMO_MODE: "true", ATLAS_SHARED_DB: db } },
    } as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, stored: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.query).toContain("(id, event_name, invite_id, created_at)");
    expect(calls[0]?.args[2]).toBeNull();
  });
});
