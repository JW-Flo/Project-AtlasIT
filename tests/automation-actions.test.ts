import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeAction,
  type ActionContext,
} from "../console-app/src/lib/server/automation-actions";

// ---------------------------------------------------------------------------
// Mock D1 database
// ---------------------------------------------------------------------------

function makeMockDb() {
  const runResult = { meta: { changes: 1 }, success: true };
  const mockStatement = {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue(runResult),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
  };

  return {
    prepare: vi.fn().mockReturnValue(mockStatement),
    _statement: mockStatement,
  } as any;
}

function makeCtx(dbOverrides?: any): ActionContext {
  return {
    db: dbOverrides ?? makeMockDb(),
    tenantId: "tenant-1",
    payload: { email: "alice@example.com", user: { name: "Alice" } },
  };
}

// ---------------------------------------------------------------------------
// Event-driven actions
// ---------------------------------------------------------------------------

describe("executeAction — event-driven actions", () => {
  it("send_notification emits a notification event", async () => {
    const db = makeMockDb();
    const ctx = makeCtx(db);
    const result = await executeAction(
      "send_notification",
      { channel: "general", message: "Hello" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("send_notification");
    expect(result.details?.eventId).toBeTruthy();
    // Verify INSERT was called on events table
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO events"),
    );
  });

  it("create_incident emits an incident.created event", async () => {
    const db = makeMockDb();
    const ctx = makeCtx(db);
    const result = await executeAction(
      "create_incident",
      { severity: "high", title: "App down" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("create_incident");
    expect(result.details?.eventId).toBeTruthy();
  });

  it("update_compliance_status emits compliance event", async () => {
    const db = makeMockDb();
    const ctx = makeCtx(db);
    const result = await executeAction(
      "update_compliance_status",
      { framework: "SOC2", status: "non_compliant" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("update_compliance_status");
  });

  it("run_workflow emits workflow.requested event", async () => {
    const db = makeMockDb();
    const ctx = makeCtx(db);
    const result = await executeAction(
      "run_workflow",
      { workflowId: "onboard-user" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("run_workflow");
  });

  it("sync_directory emits directory.sync_requested event", async () => {
    const db = makeMockDb();
    const ctx = makeCtx(db);
    const result = await executeAction("sync_directory", {}, ctx);

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("sync_directory");
  });
});

// ---------------------------------------------------------------------------
// DB-direct actions: assign_role / remove_role
// ---------------------------------------------------------------------------

describe("executeAction — assign_role", () => {
  it("creates new role row when user has no roles", async () => {
    const db = makeMockDb();
    const ctx = makeCtx(db);
    const result = await executeAction(
      "assign_role",
      { email: "bob@example.com", role: "admin" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.message).toContain("admin");
    expect(result.message).toContain("bob@example.com");
  });

  it("appends role when user already has roles", async () => {
    const db = makeMockDb();
    db._statement.first.mockResolvedValueOnce({
      id: "existing-id",
      roles: '["viewer"]',
    });
    const ctx = makeCtx(db);
    const result = await executeAction(
      "assign_role",
      { email: "bob@example.com", role: "admin" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.message).toContain("admin");
  });

  it("returns no-op when role already assigned", async () => {
    const db = makeMockDb();
    db._statement.first.mockResolvedValueOnce({
      id: "existing-id",
      roles: '["viewer","admin"]',
    });
    const ctx = makeCtx(db);
    const result = await executeAction(
      "assign_role",
      { email: "bob@example.com", role: "admin" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.details?.action).toBe("no-op");
  });

  it("fails when no email provided", async () => {
    const ctx = makeCtx();
    // Clear payload email too
    ctx.payload = {};
    const result = await executeAction("assign_role", { role: "admin" }, ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toContain("email");
  });
});

describe("executeAction — remove_role", () => {
  it("removes role from existing user", async () => {
    const db = makeMockDb();
    db._statement.first.mockResolvedValueOnce({
      id: "existing-id",
      roles: '["viewer","admin"]',
    });
    const ctx = makeCtx(db);
    const result = await executeAction(
      "remove_role",
      { email: "bob@example.com", role: "admin" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.message).toContain("removed");
  });

  it("returns no-op when user has no roles row", async () => {
    const db = makeMockDb();
    const ctx = makeCtx(db);
    const result = await executeAction(
      "remove_role",
      { email: "bob@example.com", role: "admin" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.details?.action).toBe("no-op");
  });
});

// ---------------------------------------------------------------------------
// Provisioning actions
// ---------------------------------------------------------------------------

describe("executeAction — provision/revoke app access", () => {
  it("provision_app_access emits event when app is connected", async () => {
    const db = makeMockDb();
    // First call: check app_credentials (return a row)
    db._statement.first.mockResolvedValueOnce({ id: "cred-1" });
    const ctx = makeCtx(db);
    const result = await executeAction(
      "provision_app_access",
      { appId: "slack" },
      ctx,
    );

    expect(result.status).toBe("success");
    expect(result.details?.appId).toBe("slack");
  });

  it("provision_app_access returns skipped when app not connected", async () => {
    const db = makeMockDb();
    // No credential found
    db._statement.first.mockResolvedValueOnce(null);
    const ctx = makeCtx(db);
    const result = await executeAction(
      "provision_app_access",
      { appId: "jira" },
      ctx,
    );

    expect(result.status).toBe("skipped");
    expect(result.message).toContain("not connected");
  });

  it("revoke_app_access emits event when app is connected", async () => {
    const db = makeMockDb();
    db._statement.first.mockResolvedValueOnce({ id: "cred-1" });
    const ctx = makeCtx(db);
    const result = await executeAction(
      "revoke_app_access",
      { appId: "slack" },
      ctx,
    );

    expect(result.status).toBe("success");
  });

  it("provision_app_access fails without appId", async () => {
    const ctx = makeCtx();
    const result = await executeAction("provision_app_access", {}, ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toContain("appId");
  });
});

// ---------------------------------------------------------------------------
// Unknown action type
// ---------------------------------------------------------------------------

describe("executeAction — unknown action", () => {
  it("returns failed for unknown action type", async () => {
    const ctx = makeCtx();
    const result = await executeAction("nonexistent_action" as any, {}, ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toContain("Unknown action type");
  });
});
