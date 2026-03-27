/**
 * Tests for fetchUserRoles (D1-backed RBAC role lookup).
 */
import { describe, it, expect, vi } from "vitest";
import { fetchUserRoles } from "../console-app/src/lib/auth/provider";

/** Creates a mock D1Database with a stubbed prepare().bind().first() chain */
function mockD1(row: { roles: string; tenant_id: string } | null): D1Database {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(row),
      }),
    }),
  } as unknown as D1Database;
}

describe("fetchUserRoles", () => {
  it("returns ['viewer'] when db is undefined", async () => {
    const result = await fetchUserRoles(undefined, "anyone@example.com");
    expect(result.roles).toEqual(["viewer"]);
    expect(result.tenantId).toBeUndefined();
  });

  it("returns ['viewer'] when user has no row in console_user_roles", async () => {
    const db = mockD1(null);
    const result = await fetchUserRoles(db, "unknown@example.com");
    expect(result.roles).toEqual(["viewer"]);
  });

  it("returns roles from D1 for a known user", async () => {
    const db = mockD1({
      roles: '["admin", "editor"]',
      tenant_id: "tenant-123",
    });
    const result = await fetchUserRoles(db, "admin@example.com");
    expect(result.roles).toEqual(["admin", "editor"]);
    expect(result.tenantId).toBe("tenant-123");
  });

  it("returns ['viewer'] when D1 query throws", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error("D1 unavailable")),
        }),
      }),
    } as unknown as D1Database;
    const result = await fetchUserRoles(db, "user@example.com");
    expect(result.roles).toEqual(["viewer"]);
  });

  it("returns ['viewer'] when roles JSON is an empty array", async () => {
    const db = mockD1({ roles: "[]", tenant_id: "tenant-1" });
    const result = await fetchUserRoles(db, "user@example.com");
    expect(result.roles).toEqual(["viewer"]);
  });
});
