import { describe, it, expect, vi } from "vitest";
import { listNhiCredentials } from "../ai-orchestrator/src/lib/nhi-sync";

/**
 * Create a mock D1Database that returns `count` from .first() and `results` from .all()
 */
function createMockDb(results: Record<string, unknown>[] = [], count = 0) {
  const prepareFn = vi.fn().mockImplementation(() => ({
    bind: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue({ cnt: count }),
      all: vi.fn().mockResolvedValue({ results }),
    }),
  }));

  const db = { prepare: prepareFn } as unknown as D1Database;
  return { db, prepare: prepareFn };
}

describe("listNhiCredentials", () => {
  it("returns empty list for tenant with no NHIs", async () => {
    const { db } = createMockDb([], 0);
    const result = await listNhiCredentials(db, "tenant-1", {
      limit: 100,
      offset: 0,
    });
    expect(result.total).toBe(0);
    expect(result.credentials).toEqual([]);
  });

  it("passes filters to query", async () => {
    const { db, prepare } = createMockDb([], 0);
    await listNhiCredentials(db, "tenant-1", {
      status: "active",
      credentialType: "api_key",
      provider: "github",
      limit: 50,
      offset: 10,
    });

    // Should have been called twice (count + list)
    expect(prepare).toHaveBeenCalledTimes(2);

    // The count query should include all filter conditions
    const countQuery = prepare.mock.calls[0][0] as string;
    expect(countQuery).toContain("nc.tenant_id = ?");
    expect(countQuery).toContain("nc.status = ?");
    expect(countQuery).toContain("nc.credential_type = ?");
    expect(countQuery).toContain("nc.provider = ?");
  });

  it("maps D1 rows to camelCase output", async () => {
    const rows = [
      {
        id: "cred-1",
        tenant_id: "t1",
        directory_user_id: "nhi:github:key-123",
        credential_type: "deploy_key",
        provider: "github",
        external_id: "key-123",
        display_name: "Deploy Key (prod)",
        owner_email: "admin@corp.com",
        scopes: '["repo"]',
        permissions: null,
        expires_at: null,
        last_used_at: "2026-03-01T00:00:00Z",
        last_rotated_at: null,
        risk_score: 35,
        risk_factors: '["no_expiry","no_owner"]',
        status: "active",
        metadata: "{}",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        dir_display_name: "Deploy Key (prod)",
        dir_email: "key-123@nhi.github",
      },
    ];

    const { db } = createMockDb(rows, 1);
    const result = await listNhiCredentials(db, "t1", { limit: 100, offset: 0 });

    expect(result.total).toBe(1);
    expect(result.credentials).toHaveLength(1);

    const cred = result.credentials[0];
    expect(cred.id).toBe("cred-1");
    expect(cred.credentialType).toBe("deploy_key");
    expect(cred.provider).toBe("github");
    expect(cred.displayName).toBe("Deploy Key (prod)");
    expect(cred.riskScore).toBe(35);
    expect(cred.scopes).toEqual(["repo"]);
    expect(cred.riskFactors).toEqual(["no_expiry", "no_owner"]);
    expect(cred.status).toBe("active");
  });
});
