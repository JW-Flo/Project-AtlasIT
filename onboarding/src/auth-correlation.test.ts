import { describe, it, expect, beforeAll } from "vitest";
import { Miniflare } from "miniflare";
import { build } from "esbuild";
import { readFileSync } from "fs";
import path from "path";

describe("Auth & Correlation ID", () => {
  let mf: Miniflare;
  let bundled: string;

  beforeAll(async () => {
    const entry = path.join(__dirname, "../dist/onboarding/src/index.js");
    const outfile = path.join(__dirname, "bundled-worker-auth.mjs");
    await build({
      entryPoints: [entry],
      bundle: true,
      format: "esm",
      platform: "browser",
      outfile,
      sourcemap: false,
      logLevel: "silent",
    });
    bundled = readFileSync(outfile, "utf-8");
    mf = new Miniflare({
      modules: true,
      script: bundled,
      kvNamespaces: ["STATE"],
      d1Databases: ["DB"],
      bindings: {
        AI_API_KEY: "test-key",
        API_ALLOWED_KEYS: "valid-key-1,valid-key-2",
      },
    });

    const db = await mf.getD1Database("DB");
    await db.exec(
      "CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, industry TEXT, config TEXT, status TEXT DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);",
    );
    await db.exec(
      "CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, tenant_id TEXT, type TEXT, payload TEXT, created_at TEXT NOT NULL);",
    );
  });

  it("rejects missing API key", async () => {
    const resp = await mf.dispatchFetch(
      "http://localhost:8787/api/onboarding",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t1",
          name: "Name",
          industry: "Technology",
        }),
      },
    );
    expect(resp.status).toBe(401);
  });

  it("rejects invalid API key", async () => {
    const resp = await mf.dispatchFetch(
      "http://localhost:8787/api/onboarding",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "nope" },
        body: JSON.stringify({
          tenantId: "t2",
          name: "Name",
          industry: "Technology",
        }),
      },
    );
    expect(resp.status).toBe(401);
  });

  it("accepts valid key and returns requestId + actor + audit event with requestId and actor", async () => {
    const resp = await mf.dispatchFetch(
      "http://localhost:8787/api/onboarding",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "valid-key-2",
        },
        body: JSON.stringify({
          tenantId: "t3",
          name: "Name",
          industry: "Technology",
        }),
      },
    );
    expect(resp.status).toBe(201);
    const body: any = await resp.json();
    expect(body.status).toBe("success");
    expect(body.requestId).toBeDefined();
    expect(body.actor).toBe("valid-key-2");
    const headerRequestId = resp.headers.get("x-request-id");
    expect(headerRequestId).toBeTruthy();
    const headerActor = resp.headers.get("x-actor");
    expect(headerActor).toBe("valid-key-2");

    const db = await mf.getD1Database("DB");
    const audit = await db
      .prepare("SELECT * FROM audit_events WHERE tenant_id = ?")
      .bind("t3")
      .all();
    expect(audit.results.length).toBe(1);
    const payload = JSON.parse(audit.results[0].payload as string);
    expect(payload.requestId).toBeDefined();
    expect(payload.requestId).toBe(headerRequestId);
    expect(payload.actor).toBe("valid-key-2");
  });
});
