import { describe, it, expect } from "vitest";
import { detectRiskAnomalies } from "../anomaly-detector";

function mockDb(executionRows: Record<string, unknown>[] = []) {
  return {
    prepare: (_sql: string) => ({
      bind: (..._args: unknown[]) => ({
        all: async () => ({ results: executionRows }),
      }),
    }),
  };
}

const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const now = new Date().toISOString();

describe("detectRiskAnomalies", () => {
  it("returns empty when no executions exist", async () => {
    const result = await detectRiskAnomalies(mockDb(), "tenant-1");
    expect(result).toEqual([]);
  });

  it("detects bulk privilege escalation (>5 provisions in 1 hour)", async () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({
      id: `exec-${i}`,
      rule_id: "rule-1",
      status: "success",
      results: JSON.stringify({
        actions: [{ type: "provision_app_access", config: { appId: "github" } }],
      }),
      trigger_event: JSON.stringify({
        payload: { user: { email: `user${i}@test.com` } },
      }),
      created_at: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
    }));

    const db = mockDb(rows);
    const result = await detectRiskAnomalies(db, "tenant-1");

    const escalation = result.find((a) => a.anomalyType === "bulk_privilege_escalation");
    expect(escalation).toBeDefined();
    expect(escalation!.severity).toBe("high");
    expect(escalation!.affectedApps).toContain("github");
  });

  it("does not flag normal provisioning volume (<= 5)", async () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({
      id: `exec-${i}`,
      rule_id: "rule-1",
      status: "success",
      results: JSON.stringify({
        actions: [{ type: "provision_app_access", config: { appId: "slack" } }],
      }),
      trigger_event: JSON.stringify({
        payload: { user: { email: `user${i}@test.com` } },
      }),
      created_at: new Date(Date.now() - i * 10 * 60 * 1000).toISOString(),
    }));

    const db = mockDb(rows);
    const result = await detectRiskAnomalies(db, "tenant-1");

    const escalation = result.find((a) => a.anomalyType === "bulk_privilege_escalation");
    expect(escalation).toBeUndefined();
  });

  it("detects unusual revocation volume (>10 in 1 hour)", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      id: `exec-${i}`,
      rule_id: "rule-2",
      status: "success",
      results: JSON.stringify({
        actions: [{ type: "revoke_app_access", config: { appId: "github" } }],
      }),
      trigger_event: JSON.stringify({
        payload: { user: { email: `user${i}@test.com` } },
      }),
      created_at: new Date(Date.now() - i * 3 * 60 * 1000).toISOString(),
    }));

    const db = mockDb(rows);
    const result = await detectRiskAnomalies(db, "tenant-1");

    const revocation = result.find((a) => a.anomalyType === "unusual_revocation_volume");
    expect(revocation).toBeDefined();
    expect(["high", "critical"]).toContain(revocation!.severity);
  });

  it("detects off-hours provisioning", async () => {
    // Create an execution at 3am UTC
    const offHoursDate = new Date();
    offHoursDate.setUTCHours(3, 0, 0, 0);

    const rows = [
      {
        id: "exec-offhours",
        rule_id: "rule-1",
        status: "success",
        results: JSON.stringify({
          actions: [{ type: "provision_app_access", config: { appId: "aws" } }],
        }),
        trigger_event: JSON.stringify({
          payload: { user: { email: "late@test.com" } },
        }),
        created_at: offHoursDate.toISOString(),
      },
    ];

    const db = mockDb(rows);
    const result = await detectRiskAnomalies(db, "tenant-1", {
      businessHoursStart: 6,
      businessHoursEnd: 20,
    });

    const offHours = result.find((a) => a.anomalyType === "off_hours_provisioning");
    expect(offHours).toBeDefined();
    expect(offHours!.severity).toBe("medium");
  });

  it("does not flag provisioning during business hours", async () => {
    const businessHoursDate = new Date();
    businessHoursDate.setUTCHours(14, 0, 0, 0);

    const rows = [
      {
        id: "exec-business",
        rule_id: "rule-1",
        status: "success",
        results: JSON.stringify({
          actions: [{ type: "provision_app_access", config: { appId: "slack" } }],
        }),
        trigger_event: JSON.stringify({
          payload: { user: { email: "normal@test.com" } },
        }),
        created_at: businessHoursDate.toISOString(),
      },
    ];

    const db = mockDb(rows);
    const result = await detectRiskAnomalies(db, "tenant-1", {
      businessHoursStart: 6,
      businessHoursEnd: 20,
    });

    const offHours = result.find((a) => a.anomalyType === "off_hours_provisioning");
    expect(offHours).toBeUndefined();
  });

  it("returns anomalies with correct structure", async () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({
      id: `exec-${i}`,
      rule_id: "rule-1",
      status: "success",
      results: JSON.stringify({
        actions: [{ type: "provision_app_access", config: { appId: "github" } }],
      }),
      trigger_event: JSON.stringify({
        payload: { user: { email: `user${i}@test.com` } },
      }),
      created_at: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
    }));

    const db = mockDb(rows);
    const result = await detectRiskAnomalies(db, "tenant-1");

    for (const anomaly of result) {
      expect(anomaly.anomalyType).toBeTruthy();
      expect(anomaly.severity).toBeTruthy();
      expect(anomaly.description).toBeTruthy();
      expect(anomaly.detectedAt).toBeTruthy();
      expect(Array.isArray(anomaly.affectedUsers)).toBe(true);
      expect(Array.isArray(anomaly.affectedApps)).toBe(true);
    }
  });
});
