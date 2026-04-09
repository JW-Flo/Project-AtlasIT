import { describe, it, expect, vi } from "vitest";
import { processExpiringNhiCredentials } from "../ai-orchestrator/src/lib/nhi-expiry-processor";

function createMockDb() {
  const runFn = vi.fn().mockResolvedValue({});
  const firstFn = vi.fn().mockResolvedValue(null);
  const bindFn = vi.fn().mockReturnValue({
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: runFn,
    first: firstFn,
  });
  const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });

  return {
    db: { prepare: prepareFn } as unknown as D1Database,
    prepare: prepareFn,
    bind: bindFn,
    run: runFn,
    first: firstFn,
  };
}

describe("processExpiringNhiCredentials", () => {
  it("returns zeros when no credentials exist", async () => {
    const { db } = createMockDb();
    const result = await processExpiringNhiCredentials({ sharedDb: db });

    expect(result.expiringSoon).toBe(0);
    expect(result.expired).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("queries for expiring and expired credentials", async () => {
    const { db, prepare } = createMockDb();
    await processExpiringNhiCredentials({ sharedDb: db });

    // Should have at least 2 prepared queries: expiring scan + expired scan
    expect(prepare).toHaveBeenCalledTimes(2);

    const expiringQuery = prepare.mock.calls[0][0] as string;
    expect(expiringQuery).toContain("nhi_credentials");
    expect(expiringQuery).toMatch(/status.*IN.*'active'/);
    expect(expiringQuery).toContain("expires_at");

    const expiredQuery = prepare.mock.calls[1][0] as string;
    expect(expiredQuery).toContain("nhi_credentials");
    expect(expiredQuery).toMatch(/status.*IN.*'active'/);
  });

  it("processes expiring tokens and emits evidence", async () => {
    const now = new Date();
    const expiringDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

    const expiringRows = [
      {
        id: "cred-1",
        tenant_id: "t1",
        display_name: "GitHub Deploy Key",
        credential_type: "deploy_key",
        provider: "github",
        external_id: "key-123",
        owner_email: "dev@corp.com",
        expires_at: expiringDate.toISOString(),
      },
    ];

    const runFn = vi.fn().mockResolvedValue({});
    let callCount = 0;
    const prepareFn = vi.fn().mockImplementation(() => ({
      bind: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: callCount++ === 0 ? expiringRows : [],
        }),
        run: runFn,
      }),
    }));

    const db = { prepare: prepareFn } as unknown as D1Database;
    const result = await processExpiringNhiCredentials({ sharedDb: db });

    expect(result.expiringSoon).toBe(1);
    expect(result.expired).toBe(0);
    // Evidence inserts should have been called (INSERT OR IGNORE INTO compliance_evidence)
    expect(runFn).toHaveBeenCalled();
  });

  it("marks expired tokens and writes audit log", async () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

    const expiredRows = [
      {
        id: "cred-2",
        tenant_id: "t1",
        display_name: "AWS Access Key",
        credential_type: "access_key",
        provider: "aws",
        external_id: "AKIA123",
        owner_email: null,
        expires_at: expiredDate.toISOString(),
      },
    ];

    const runFn = vi.fn().mockResolvedValue({});
    let callCount = 0;
    const prepareFn = vi.fn().mockImplementation(() => ({
      bind: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: callCount++ === 0 ? [] : expiredRows,
        }),
        run: runFn,
      }),
    }));

    const db = { prepare: prepareFn } as unknown as D1Database;
    const result = await processExpiringNhiCredentials({ sharedDb: db });

    expect(result.expiringSoon).toBe(0);
    expect(result.expired).toBe(1);

    // Should have called run for: UPDATE status, INSERT audit_log, INSERT evidence (multiple)
    expect(runFn.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
