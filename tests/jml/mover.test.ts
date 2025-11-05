import { describe, it, expect, beforeEach } from "vitest";
import {
  MoverWorker,
  type Connector,
  type Policy,
} from "../../workers/jml/mover.js";

describe("MoverWorker", () => {
  let worker: MoverWorker;

  beforeEach(() => {
    worker = new MoverWorker();
  });

  describe("detectAttributeDeltas", () => {
    it("detects department change", () => {
      const delta = worker.detectAttributeDeltas(
        { department: "Sales", title: "Account Executive" },
        { department: "Engineering", title: "Account Executive" },
      );

      expect(delta.department).toEqual({ from: "Sales", to: "Engineering" });
      expect(delta.title).toBeUndefined();
    });

    it("detects title change", () => {
      const delta = worker.detectAttributeDeltas(
        { department: "Engineering", title: "Junior Engineer" },
        { department: "Engineering", title: "Senior Engineer" },
      );

      expect(delta.title).toEqual({
        from: "Junior Engineer",
        to: "Senior Engineer",
      });
      expect(delta.department).toBeUndefined();
    });

    it("detects multiple changes", () => {
      const delta = worker.detectAttributeDeltas(
        {
          department: "Customer Success",
          title: "Account Manager",
          manager: "john@example.com",
        },
        {
          department: "Revenue Operations",
          title: "Revenue Ops Manager",
          manager: "jane@example.com",
        },
      );

      expect(delta.department).toEqual({
        from: "Customer Success",
        to: "Revenue Operations",
      });
      expect(delta.title).toEqual({
        from: "Account Manager",
        to: "Revenue Ops Manager",
      });
      expect(delta.manager).toEqual({
        from: "john@example.com",
        to: "jane@example.com",
      });
    });

    it("returns empty object when no changes", () => {
      const delta = worker.detectAttributeDeltas(
        { department: "Engineering", title: "Engineer" },
        { department: "Engineering", title: "Engineer" },
      );

      expect(Object.keys(delta)).toHaveLength(0);
    });

    it("handles manager addition", () => {
      const delta = worker.detectAttributeDeltas(
        { department: "Engineering", title: "Engineer" },
        {
          department: "Engineering",
          title: "Engineer",
          manager: "manager@example.com",
        },
      );

      expect(delta.manager).toEqual({
        from: "none",
        to: "manager@example.com",
      });
    });
  });

  describe("calculateEntitlementChanges", () => {
    it("calculates additions", () => {
      const changes = worker.calculateEntitlementChanges(
        ["okta", "slack"],
        ["okta", "slack", "github", "notion"],
      );

      expect(changes.add).toEqual(["github", "notion"]);
      expect(changes.remove).toEqual([]);
      expect(changes.retain).toEqual(["okta", "slack"]);
    });

    it("calculates removals", () => {
      const changes = worker.calculateEntitlementChanges(
        ["okta", "slack", "salesforce", "gong"],
        ["okta", "slack"],
      );

      expect(changes.add).toEqual([]);
      expect(changes.remove).toEqual(["salesforce", "gong"]);
      expect(changes.retain).toEqual(["okta", "slack"]);
    });

    it("calculates mixed changes", () => {
      const changes = worker.calculateEntitlementChanges(
        ["okta", "salesforce", "gong"],
        ["okta", "salesforce", "clari", "mode"],
      );

      expect(changes.add).toEqual(["clari", "mode"]);
      expect(changes.remove).toEqual(["gong"]);
      expect(changes.retain).toEqual(["okta", "salesforce"]);
    });

    it("handles empty previous entitlements", () => {
      const changes = worker.calculateEntitlementChanges([], ["okta", "slack"]);

      expect(changes.add).toEqual(["okta", "slack"]);
      expect(changes.remove).toEqual([]);
      expect(changes.retain).toEqual([]);
    });

    it("handles empty target entitlements", () => {
      const changes = worker.calculateEntitlementChanges(["okta", "slack"], []);

      expect(changes.add).toEqual([]);
      expect(changes.remove).toEqual(["okta", "slack"]);
      expect(changes.retain).toEqual([]);
    });
  });

  describe("applyRoleChange", () => {
    it("updates user via connectors", async () => {
      const updates: any[] = [];
      const mockConnector: Connector = {
        name: "okta",
        updateUser: async (userId, attributes) => {
          updates.push({ userId, attributes });
          return { success: true };
        },
      };

      const result = await worker.applyRoleChange(
        { id: "user-123", email: "user@example.com" },
        { department: "Engineering", title: "Senior Engineer" },
        [mockConnector],
      );

      expect(result.success).toBe(true);
      expect(result.updated).toEqual(["okta"]);
      expect(updates).toHaveLength(1);
      expect(updates[0].attributes.department).toBe("Engineering");
      expect(updates[0].attributes.title).toBe("Senior Engineer");
    });

    it("handles connector errors gracefully", async () => {
      const mockConnector: Connector = {
        name: "okta",
        updateUser: async () => {
          throw new Error("Connection timeout");
        },
      };

      const result = await worker.applyRoleChange(
        { id: "user-123", email: "user@example.com" },
        { department: "Engineering", title: "Senior Engineer" },
        [mockConnector],
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].connector).toBe("okta");
      expect(result.errors[0].error).toContain("Connection timeout");
    });

    it("updates via multiple connectors", async () => {
      const updates: string[] = [];
      const connector1: Connector = {
        name: "okta",
        updateUser: async () => {
          updates.push("okta");
        },
      };
      const connector2: Connector = {
        name: "google-workspace",
        updateUser: async () => {
          updates.push("google");
        },
      };

      const result = await worker.applyRoleChange(
        { id: "user-123", email: "user@example.com" },
        { department: "Engineering", title: "Senior Engineer" },
        [connector1, connector2],
      );

      expect(result.success).toBe(true);
      expect(result.updated).toEqual(["okta", "google-workspace"]);
      expect(updates).toEqual(["okta", "google"]);
    });
  });

  describe("reconcileEntitlements", () => {
    it("adds and removes entitlements", async () => {
      const operations: any[] = [];
      const mockConnector: Connector = {
        name: "adapter",
        addEntitlement: async (userId, entitlement) => {
          operations.push({ op: "add", userId, entitlement });
        },
        removeEntitlement: async (userId, entitlement) => {
          operations.push({ op: "remove", userId, entitlement });
        },
      };

      const result = await worker.reconcileEntitlements(
        { id: "user-123", email: "user@example.com" },
        { add: ["github", "notion"], remove: ["salesforce"], retain: ["okta"] },
        [mockConnector],
      );

      expect(result.success).toBe(true);
      expect(result.applied).toContain("github");
      expect(result.applied).toContain("notion");
      expect(result.applied).toContain("okta");
      expect(operations.filter((o) => o.op === "add")).toHaveLength(2);
      expect(operations.filter((o) => o.op === "remove")).toHaveLength(1);
    });

    it("processes removals before additions (security-first)", async () => {
      const order: string[] = [];
      const mockConnector: Connector = {
        name: "adapter",
        addEntitlement: async (userId, entitlement) => {
          order.push(`add:${entitlement}`);
        },
        removeEntitlement: async (userId, entitlement) => {
          order.push(`remove:${entitlement}`);
        },
      };

      await worker.reconcileEntitlements(
        { id: "user-123", email: "user@example.com" },
        { add: ["github"], remove: ["salesforce"], retain: [] },
        [mockConnector],
      );

      expect(order[0]).toBe("remove:salesforce");
      expect(order[1]).toBe("add:github");
    });

    it("handles partial failures", async () => {
      const mockConnector: Connector = {
        name: "adapter",
        addEntitlement: async (userId, entitlement) => {
          if (entitlement === "github") {
            throw new Error("GitHub API error");
          }
        },
        removeEntitlement: async () => {},
      };

      const result = await worker.reconcileEntitlements(
        { id: "user-123", email: "user@example.com" },
        { add: ["github", "notion"], remove: [], retain: ["okta"] },
        [mockConnector],
      );

      expect(result.success).toBe(false);
      expect(result.applied).toContain("notion");
      expect(result.applied).toContain("okta");
      expect(result.failed).toContain("github");
    });
  });

  describe("enforcePolicy", () => {
    it("validates allowed transitions", () => {
      const policy: Policy = {
        allowedTransitions: ["Engineering", "Product"],
      };

      const violations = worker.enforcePolicy(
        { id: "user-123" },
        { department: "Sales", title: "Account Executive" },
        policy,
      );

      expect(violations).toHaveLength(1);
      expect(violations[0].code).toBe("DISALLOWED_TRANSITION");
      expect(violations[0].severity).toBe("warning");
    });

    it("allows valid transitions", () => {
      const policy: Policy = {
        allowedTransitions: ["Engineering", "Product"],
      };

      const violations = worker.enforcePolicy(
        { id: "user-123" },
        { department: "Engineering", title: "Senior Engineer" },
        policy,
      );

      expect(violations).toHaveLength(0);
    });

    it("returns no violations when no policy restrictions", () => {
      const violations = worker.enforcePolicy(
        { id: "user-123" },
        { department: "Any Department", title: "Any Title" },
        {},
      );

      expect(violations).toHaveLength(0);
    });
  });

  describe("verifyMFACompliance", () => {
    it("returns true when MFA is enabled", async () => {
      const mockConnector: Connector = {
        name: "okta",
        verifyMFA: async () => true,
      };

      const result = await worker.verifyMFACompliance({ id: "user-123" }, [
        mockConnector,
      ]);

      expect(result).toBe(true);
    });

    it("returns false when MFA is not enabled", async () => {
      const mockConnector: Connector = {
        name: "okta",
        verifyMFA: async () => false,
      };

      const result = await worker.verifyMFACompliance({ id: "user-123" }, [
        mockConnector,
      ]);

      expect(result).toBe(false);
    });

    it("returns false when verification fails", async () => {
      const mockConnector: Connector = {
        name: "okta",
        verifyMFA: async () => {
          throw new Error("API error");
        },
      };

      const result = await worker.verifyMFACompliance({ id: "user-123" }, [
        mockConnector,
      ]);

      expect(result).toBe(false);
    });

    it("returns true when no connectors have MFA verification", async () => {
      const mockConnector: Connector = {
        name: "slack",
      };

      const result = await worker.verifyMFACompliance({ id: "user-123" }, [
        mockConnector,
      ]);

      expect(result).toBe(true);
    });
  });

  describe("emitEvidence", () => {
    it("generates evidence with correct structure", async () => {
      const traceId = "test-trace-123";
      const userId = "user-123";
      const delta = {
        department: { from: "Sales", to: "Engineering" },
      };
      const changes = {
        add: ["github"],
        remove: ["salesforce"],
        retain: ["okta"],
      };

      const evidencePath = await worker.emitEvidence(
        traceId,
        userId,
        delta,
        changes,
        "completed",
      );

      expect(evidencePath).toContain(traceId);
      expect(evidencePath).toMatch(
        /\/artifacts\/jml\/mover\/EV-mover-.*\.json/,
      );
    });

    it("includes error in evidence when provided", async () => {
      const evidencePath = await worker.emitEvidence(
        "trace-fail",
        "user-123",
        {},
        { add: [], remove: [], retain: [] },
        "failed",
        "Connection timeout",
      );

      expect(evidencePath).toBeDefined();
    });
  });

  describe("execute - full workflow", () => {
    it("executes complete mover workflow successfully", async () => {
      const operations: string[] = [];
      const mockConnector: Connector = {
        name: "mock-idp",
        updateUser: async () => {
          operations.push("update");
        },
        addEntitlement: async () => {
          operations.push("add");
        },
        removeEntitlement: async () => {
          operations.push("remove");
        },
        verifyMFA: async () => true,
      };

      const result = await worker.execute({
        user: {
          id: "user-move-002",
          email: "alex.roe@acme.example",
          displayName: "Alex Roe",
          department: "Customer Success",
          title: "Account Manager",
        },
        newRole: {
          department: "Revenue Operations",
          title: "Revenue Ops Manager",
          effectiveDate: "2025-09-01",
        },
        entitlements: {
          previous: ["okta", "salesforce", "gong"],
          target: ["okta", "salesforce", "clari", "mode"],
        },
        connectors: [mockConnector],
      });

      expect(result.success).toBe(true);
      expect(result.traceId).toMatch(/^mover-/);
      expect(result.delta.department).toEqual({
        from: "Customer Success",
        to: "Revenue Operations",
      });
      expect(result.entitlementChanges.add).toEqual(["clari", "mode"]);
      expect(result.entitlementChanges.remove).toEqual(["gong"]);
      expect(result.entitlementChanges.retain).toEqual(["okta", "salesforce"]);
      expect(result.evidencePath).toContain("EV-mover-");
      expect(operations).toContain("update");
      expect(operations).toContain("add");
      expect(operations).toContain("remove");
    });

    it("handles policy violations", async () => {
      const policy: Policy = {
        allowedTransitions: ["Engineering"],
      };

      const result = await worker.execute({
        user: {
          id: "user-123",
          email: "user@example.com",
          displayName: "User",
          department: "Sales",
          title: "Sales Rep",
        },
        newRole: {
          department: "Marketing",
          title: "Marketing Manager",
        },
        entitlements: {
          previous: ["okta"],
          target: ["okta"],
        },
        policy,
      });

      expect(result.success).toBe(true); // Warning doesn't block
      expect(result.traceId).toBeDefined();
    });

    it("handles execution errors", async () => {
      const mockConnector: Connector = {
        name: "failing-connector",
        updateUser: async () => {
          throw new Error("Critical error");
        },
      };

      const result = await worker.execute({
        user: {
          id: "user-123",
          email: "user@example.com",
          displayName: "User",
          department: "Sales",
          title: "Sales Rep",
        },
        newRole: {
          department: "Engineering",
          title: "Engineer",
        },
        entitlements: {
          previous: ["okta"],
          target: ["okta", "github"],
        },
        connectors: [mockConnector],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.evidencePath).toBeDefined();
    });

    it("generates unique trace IDs for each execution", async () => {
      const result1 = await worker.execute({
        user: {
          id: "user-1",
          email: "user1@example.com",
          displayName: "User 1",
          department: "Sales",
          title: "Sales Rep",
        },
        newRole: { department: "Engineering", title: "Engineer" },
        entitlements: { previous: [], target: [] },
      });

      const result2 = await worker.execute({
        user: {
          id: "user-2",
          email: "user2@example.com",
          displayName: "User 2",
          department: "Sales",
          title: "Sales Rep",
        },
        newRole: { department: "Engineering", title: "Engineer" },
        entitlements: { previous: [], target: [] },
      });

      expect(result1.traceId).not.toBe(result2.traceId);
    });
  });
});
