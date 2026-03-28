import { describe, it, expect } from "vitest";
import { detectComplianceDrift } from "../drift-detector";
import type { DriftAlert } from "../types";

function mockDb(evidenceRows: Record<string, unknown>[] = []) {
  return {
    prepare: () => ({
      bind: (..._args: unknown[]) => ({
        all: async () => ({ results: evidenceRows }),
      }),
    }),
  };
}

describe("detectComplianceDrift", () => {
  it("returns empty alerts when no drift events are provided", async () => {
    const result = await detectComplianceDrift(mockDb(), "tenant-1", []);
    expect(result.alerts).toEqual([]);
    expect(result.tenantId).toBe("tenant-1");
  });

  it("detects adapter disconnection drift", async () => {
    const events = [
      {
        type: "app_disconnected",
        source: "slack",
        timestamp: new Date().toISOString(),
        metadata: { appId: "slack", appName: "Slack" },
      },
    ];
    // Return evidence rows that reference the disconnected adapter
    const evidenceRows = [
      { framework: "SOC2", control_id: "CC6.1" },
      { framework: "ISO27001", control_id: "A.9.2.2" },
    ];
    const result = await detectComplianceDrift(mockDb(evidenceRows), "tenant-1", events);

    expect(result.alerts.length).toBeGreaterThan(0);
    const alert = result.alerts.find((a) => a.alertType === "adapter_disconnected");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.affectedControls.length).toBeGreaterThan(0);
    expect(alert!.suggestedRemediation).toBeTruthy();
  });

  it("detects adapter health failure drift", async () => {
    const events = [
      {
        type: "app_health_changed",
        source: "github",
        timestamp: new Date().toISOString(),
        metadata: { appId: "github", healthy: false },
      },
    ];
    const result = await detectComplianceDrift(mockDb([]), "tenant-1", events);

    const alert = result.alerts.find((a) => a.alertType === "adapter_health_failure");
    expect(alert).toBeDefined();
    expect(["high", "medium"]).toContain(alert!.severity);
  });

  it("detects rule disabled drift", async () => {
    const events = [
      {
        type: "rule_disabled",
        source: "automation",
        timestamp: new Date().toISOString(),
        metadata: {
          ruleId: "rule-1",
          ruleName: "Auto-revoke on departure",
          actionTypes: ["revoke_app_access"],
        },
      },
    ];
    const result = await detectComplianceDrift(mockDb([]), "tenant-1", events);

    const alert = result.alerts.find((a) => a.alertType === "rule_disabled");
    expect(alert).toBeDefined();
    expect(alert!.affectedControls.length).toBeGreaterThan(0);
    expect(alert!.description).toContain("Auto-revoke on departure");
  });

  it("detects score regression drift", async () => {
    const events = [
      {
        type: "compliance_score_changed",
        source: "scoring",
        timestamp: new Date().toISOString(),
        metadata: { framework: "SOC2", oldScore: 85, newScore: 60, direction: "down" },
      },
    ];
    const result = await detectComplianceDrift(mockDb([]), "tenant-1", events);

    const alert = result.alerts.find((a) => a.alertType === "score_regression");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
    expect(alert!.affectedFrameworks).toContain("SOC2");
  });

  it("ignores score improvements (not drift)", async () => {
    const events = [
      {
        type: "compliance_score_changed",
        source: "scoring",
        timestamp: new Date().toISOString(),
        metadata: { framework: "SOC2", oldScore: 60, newScore: 85, direction: "up" },
      },
    ];
    const result = await detectComplianceDrift(mockDb([]), "tenant-1", events);

    const regressionAlert = result.alerts.find((a) => a.alertType === "score_regression");
    expect(regressionAlert).toBeUndefined();
  });

  it("assigns correct severity based on drift magnitude", async () => {
    const events = [
      {
        type: "compliance_score_changed",
        source: "scoring",
        timestamp: new Date().toISOString(),
        metadata: { framework: "SOC2", oldScore: 80, newScore: 75, direction: "down" },
      },
    ];
    const result = await detectComplianceDrift(mockDb([]), "tenant-1", events);

    const alert = result.alerts.find((a) => a.alertType === "score_regression");
    expect(alert).toBeDefined();
    // Small drop (5 points) should be medium, not critical
    expect(["medium", "high"]).toContain(alert!.severity);
  });

  it("handles multiple drift events in a single call", async () => {
    const events = [
      {
        type: "app_disconnected",
        source: "slack",
        timestamp: new Date().toISOString(),
        metadata: { appId: "slack" },
      },
      {
        type: "rule_disabled",
        source: "automation",
        timestamp: new Date().toISOString(),
        metadata: {
          ruleId: "rule-1",
          ruleName: "Health alert",
          actionTypes: ["create_incident"],
        },
      },
    ];
    const result = await detectComplianceDrift(mockDb([]), "tenant-1", events);

    expect(result.alerts.length).toBe(2);
    const types = result.alerts.map((a) => a.alertType);
    expect(types).toContain("adapter_disconnected");
    expect(types).toContain("rule_disabled");
  });
});
