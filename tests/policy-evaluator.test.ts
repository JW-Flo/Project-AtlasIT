import { describe, expect, it, beforeEach } from "vitest";
import { CloudflarePolicyEvaluator } from "../packages/shared/src/platform/cloudflare/policy-evaluator";

describe("CloudflarePolicyEvaluator", () => {
  let evaluator: CloudflarePolicyEvaluator;

  beforeEach(() => {
    evaluator = new CloudflarePolicyEvaluator("test-bundle-v1");
  });

  it("default-deny: rejects when no roles match", async () => {
    const result = await evaluator.evaluate({
      action: "workflow.execute",
      subject: { roles: [], tenantId: "t1" },
      tenantId: "t1",
    });
    expect((result.decision as any).allow).toBe(false);
  });

  it("allows workflow.execute with automation:execute role", async () => {
    const result = await evaluator.evaluate({
      action: "workflow.execute",
      subject: { roles: ["automation:execute"], tenantId: "t1" },
      tenantId: "t1",
    });
    expect((result.decision as any).allow).toBe(true);
  });

  it("allows evidence.read with evidence:read role", async () => {
    const result = await evaluator.evaluate({
      action: "evidence.read",
      subject: { roles: ["evidence:read"], tenantId: "t1" },
      tenantId: "t1",
    });
    expect((result.decision as any).allow).toBe(true);
  });

  it("allows admin actions with admin:* prefix role", async () => {
    const result = await evaluator.evaluate({
      action: "tenant.configure",
      subject: { roles: ["admin:tenant"], tenantId: "t1" },
      tenantId: "t1",
    });
    expect((result.decision as any).allow).toBe(true);
  });

  it("denies retention.purge without admin:retention", async () => {
    const result = await evaluator.evaluate({
      action: "retention.purge",
      subject: { roles: ["admin:tenant"], tenantId: "t1" },
      tenantId: "t1",
    });
    expect((result.decision as any).allow).toBe(false);
    expect((result.decision as any).deny).toContain("missing required role admin:retention");
  });

  it("allows retention.purge with admin:retention", async () => {
    const result = await evaluator.evaluate({
      action: "retention.purge",
      subject: { roles: ["admin:retention"], tenantId: "t1" },
      tenantId: "t1",
    });
    expect((result.decision as any).allow).toBe(true);
  });

  it("returns unique decisionId and bundleRevision", async () => {
    const r1 = await evaluator.evaluate({ action: "test", subject: { roles: [] } });
    const r2 = await evaluator.evaluate({ action: "test", subject: { roles: [] } });
    expect(r1.decisionId).not.toBe(r2.decisionId);
    expect(r1.bundleRevision).toBe("test-bundle-v1");
  });

  it("accumulates decision logs for evidence", async () => {
    await evaluator.evaluate({ action: "a", subject: { roles: [] } });
    await evaluator.evaluate({ action: "b", subject: { roles: [] } });

    const logs = evaluator.getDecisionLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].query).toBe("data.atlasit.authz.allow");
    expect(logs[0].input).toHaveProperty("action", "a");
  });

  it("flushDecisionLogs clears the log buffer", async () => {
    await evaluator.evaluate({ action: "test", subject: { roles: [] } });
    expect(evaluator.getDecisionLogs()).toHaveLength(1);

    evaluator.flushDecisionLogs();
    expect(evaluator.getDecisionLogs()).toHaveLength(0);
  });
});
