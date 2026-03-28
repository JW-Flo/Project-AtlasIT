import { describe, it, expect } from "vitest";
import { resolveRoleEntitlements, getUserRoleIds } from "../types";

/**
 * Minimal D1-like mock that returns result sets in order.
 * First prepare().bind().all() call returns resultSets[0],
 * second call returns resultSets[1], etc.
 */
function mockDb(resultSets: Record<string, unknown>[][] = []) {
  let callIndex = 0;
  return {
    prepare: () => ({
      bind: (..._args: unknown[]) => ({
        all: async () => ({
          results: resultSets[callIndex++] ?? [],
        }),
      }),
    }),
  };
}

describe("resolveRoleEntitlements", () => {
  it("returns empty for empty roleIds", async () => {
    const db = mockDb([]);
    const result = await resolveRoleEntitlements(db, "tenant-1", []);
    expect(result).toEqual([]);
  });

  it("returns direct entitlements for a single role", async () => {
    const db = mockDb([
      // First call: all roles for tenant
      [{ id: "role-1", name: "Engineer", parent_id: null }],
      // Second call: entitlements for role-1
      [{ role_id: "role-1", app_id: "slack", app_role: "member" }],
    ]);

    const result = await resolveRoleEntitlements(db, "tenant-1", ["role-1"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      appId: "slack",
      appRole: "member",
      fromRoleId: "role-1",
      fromRoleName: "Engineer",
      inherited: false,
    });
  });

  it("walks parent_id chain and includes inherited entitlements", async () => {
    const db = mockDb([
      // All roles: team -> department -> org
      [
        { id: "role-team", name: "Frontend Team", parent_id: "role-dept" },
        { id: "role-dept", name: "Engineering Dept", parent_id: "role-org" },
        { id: "role-org", name: "Org Wide", parent_id: null },
      ],
      // Entitlements across the chain
      [
        { role_id: "role-team", app_id: "figma", app_role: "editor" },
        { role_id: "role-dept", app_id: "github", app_role: "developer" },
        { role_id: "role-org", app_id: "slack", app_role: "member" },
      ],
    ]);

    const result = await resolveRoleEntitlements(db, "tenant-1", ["role-team"]);

    expect(result).toHaveLength(3);

    const figma = result.find((e) => e.appId === "figma");
    expect(figma).toEqual({
      appId: "figma",
      appRole: "editor",
      fromRoleId: "role-team",
      fromRoleName: "Frontend Team",
      inherited: false,
    });

    const github = result.find((e) => e.appId === "github");
    expect(github).toEqual({
      appId: "github",
      appRole: "developer",
      fromRoleId: "role-dept",
      fromRoleName: "Engineering Dept",
      inherited: true,
    });

    const slack = result.find((e) => e.appId === "slack");
    expect(slack).toEqual({
      appId: "slack",
      appRole: "member",
      fromRoleId: "role-org",
      fromRoleName: "Org Wide",
      inherited: true,
    });
  });

  it("deduplicates by appId (direct wins over inherited)", async () => {
    const db = mockDb([
      // Child role overrides parent's slack entitlement
      [
        { id: "role-child", name: "Child", parent_id: "role-parent" },
        { id: "role-parent", name: "Parent", parent_id: null },
      ],
      // Both have slack entitlements; direct (child) appears first
      [
        { role_id: "role-child", app_id: "slack", app_role: "admin" },
        { role_id: "role-parent", app_id: "slack", app_role: "member" },
        { role_id: "role-parent", app_id: "jira", app_role: "viewer" },
      ],
    ]);

    const result = await resolveRoleEntitlements(db, "tenant-1", ["role-child"]);

    expect(result).toHaveLength(2);

    const slack = result.find((e) => e.appId === "slack");
    expect(slack!.appRole).toBe("admin");
    expect(slack!.fromRoleId).toBe("role-child");
    expect(slack!.inherited).toBe(false);

    const jira = result.find((e) => e.appId === "jira");
    expect(jira!.appRole).toBe("viewer");
    expect(jira!.inherited).toBe(true);
  });

  it("handles circular parent references without infinite loop", async () => {
    const db = mockDb([
      // Circular: A -> B -> A
      [
        { id: "role-a", name: "Role A", parent_id: "role-b" },
        { id: "role-b", name: "Role B", parent_id: "role-a" },
      ],
      // Entitlements for both
      [
        { role_id: "role-a", app_id: "slack", app_role: "member" },
        { role_id: "role-b", app_id: "github", app_role: "dev" },
      ],
    ]);

    // Should not hang or throw; visited set breaks the cycle
    const result = await resolveRoleEntitlements(db, "tenant-1", ["role-a"]);

    expect(result).toHaveLength(2);
    expect(result.find((e) => e.appId === "slack")).toBeDefined();
    expect(result.find((e) => e.appId === "github")).toBeDefined();
  });
});

describe("getUserRoleIds", () => {
  it("returns empty when no assignments exist", async () => {
    const db = mockDb([
      // Direct user assignments: none
      [],
    ]);

    const result = await getUserRoleIds(db, "tenant-1", "user-1", []);
    expect(result).toEqual([]);
  });

  it("returns direct user role assignments", async () => {
    const db = mockDb([
      // Direct user assignments
      [{ role_id: "role-1" }, { role_id: "role-2" }],
    ]);

    const result = await getUserRoleIds(db, "tenant-1", "user-1", []);

    expect(result).toHaveLength(2);
    expect(result).toContain("role-1");
    expect(result).toContain("role-2");
  });

  it("returns group-based role assignments", async () => {
    const db = mockDb([
      // Direct user assignments: none
      [],
      // Group-based assignments
      [{ role_id: "role-3" }, { role_id: "role-4" }],
    ]);

    const result = await getUserRoleIds(db, "tenant-1", "user-1", ["group-a", "group-b"]);

    expect(result).toHaveLength(2);
    expect(result).toContain("role-3");
    expect(result).toContain("role-4");
  });

  it("combines direct + group assignments, deduplicating", async () => {
    const db = mockDb([
      // Direct: role-1 and role-2
      [{ role_id: "role-1" }, { role_id: "role-2" }],
      // Group: role-2 (duplicate) and role-3
      [{ role_id: "role-2" }, { role_id: "role-3" }],
    ]);

    const result = await getUserRoleIds(db, "tenant-1", "user-1", ["group-a"]);

    expect(result).toHaveLength(3);
    expect(result).toContain("role-1");
    expect(result).toContain("role-2");
    expect(result).toContain("role-3");
  });
});
