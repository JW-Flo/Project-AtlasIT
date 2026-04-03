import { describe, it, expect, vi } from "vitest";
import worker from "../index";

function makeD1Stub(rows: Array<Record<string, unknown>> = []) {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: rows }),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  return {
    prepare: vi.fn().mockReturnValue(stmt),
    batch: vi.fn().mockResolvedValue([]),
    _stmt: stmt,
  };
}

function makeEnv(tenantRows: Array<{ id: string }> = [{ id: "demo" }]) {
  const complianceDb = makeD1Stub();
  const sharedDb = makeD1Stub(tenantRows);
  return {
    D1_COMPLIANCE: complianceDb as unknown as D1Database,
    ATLAS_SHARED_DB: sharedDb as unknown as D1Database,
    EVIDENCE_BUCKET: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue({ objects: [] }),
    } as unknown as R2Bucket,
    API_TOKENS: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    } as unknown as KVNamespace,
    _sharedDb: sharedDb,
    _complianceDb: complianceDb,
  };
}

describe("scheduled handler", () => {
  it("exports a scheduled handler", () => {
    expect(typeof worker.scheduled).toBe("function");
  });

  it("calls waitUntil with snapshot refresh", async () => {
    const env = makeEnv([{ id: "tenant-a" }, { id: "tenant-b" }]);
    const waitUntilFn = vi.fn();
    const ctx = { waitUntil: waitUntilFn } as unknown as ExecutionContext;
    const event = { cron: "*/5 * * * *", scheduledTime: Date.now() } as ScheduledEvent;

    await worker.scheduled(event, env as any, ctx);

    expect(waitUntilFn).toHaveBeenCalledTimes(1);
    // The promise passed to waitUntil should resolve without error
    const promise = waitUntilFn.mock.calls[0][0];
    await expect(promise).resolves.not.toThrow();
  });

  it("queries tenants from ATLAS_SHARED_DB", async () => {
    const env = makeEnv([{ id: "t1" }]);
    const waitUntilFn = vi.fn();
    const ctx = { waitUntil: waitUntilFn } as unknown as ExecutionContext;
    const event = { cron: "*/5 * * * *", scheduledTime: Date.now() } as ScheduledEvent;

    await worker.scheduled(event, env as any, ctx);
    await waitUntilFn.mock.calls[0][0];

    // ATLAS_SHARED_DB should have been queried for tenants
    const prepareCalls = env._sharedDb.prepare.mock.calls.map((c: string[][]) => c[0]);
    expect(
      prepareCalls.some((sql: string) => sql.includes("SELECT DISTINCT id FROM tenants")),
    ).toBe(true);
  });

  it("persists snapshots to D1_COMPLIANCE for each tenant", async () => {
    const env = makeEnv([{ id: "t1" }, { id: "t2" }]);
    const waitUntilFn = vi.fn();
    const ctx = { waitUntil: waitUntilFn } as unknown as ExecutionContext;
    const event = { cron: "*/5 * * * *", scheduledTime: Date.now() } as ScheduledEvent;

    await worker.scheduled(event, env as any, ctx);
    await waitUntilFn.mock.calls[0][0];

    // Compliance DB should have snapshot inserts (CREATE TABLE + INSERT for each tenant)
    const prepareCalls = env._complianceDb.prepare.mock.calls.map((c: string[][]) => c[0]);
    const insertCalls = prepareCalls.filter((sql: string) => sql.includes("INSERT INTO snapshots"));
    expect(insertCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to demo tenant when tenants table is empty", async () => {
    const env = makeEnv([]);
    const waitUntilFn = vi.fn();
    const ctx = { waitUntil: waitUntilFn } as unknown as ExecutionContext;
    const event = { cron: "*/5 * * * *", scheduledTime: Date.now() } as ScheduledEvent;

    await worker.scheduled(event, env as any, ctx);
    await waitUntilFn.mock.calls[0][0];

    // Should still persist a snapshot for the default "demo" tenant
    const bindCalls = env._complianceDb._stmt.bind.mock.calls;
    const demoBinds = bindCalls.filter((args: string[]) => args[0] === "demo");
    expect(demoBinds.length).toBeGreaterThan(0);
  });
});
