/**
 * Tests for synthetic evidence generation
 */

import { describe, it, expect } from "vitest";
import { generateSyntheticEvidence } from "../synthetic-evidence";

describe("generateSyntheticEvidence", () => {
  it("generates base SOC2 controls for technology industry", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-tenant-123",
      industry: "technology",
      employeeCount: 50,
      frameworks: ["SOC2"],
    });

    expect(evidence.length).toBeGreaterThan(0);

    // Should have SOC2 controls
    const soc2Controls = evidence.filter((e) => e.framework === "SOC2");
    expect(soc2Controls.length).toBeGreaterThan(0);

    // All evidence should be marked as synthetic
    expect(evidence.every((e) => e.source === "synthetic")).toBe(true);

    // All evidence should have required fields
    evidence.forEach((e) => {
      expect(e.id).toBeTruthy();
      expect(e.tenant_id).toBe("test-tenant-123");
      expect(e.framework).toBeTruthy();
      expect(e.control_id).toBeTruthy();
      expect(e.data.synthetic).toBe(true);
      expect(e.data.generated_at).toBeTruthy();
      expect(e.data.estimated_confidence).toBeGreaterThan(0);
      expect(e.data.estimated_confidence).toBeLessThanOrEqual(1);
    });
  });

  it("generates HIPAA controls for healthcare industry", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-tenant-456",
      industry: "healthcare",
      employeeCount: 100,
      frameworks: ["HIPAA", "SOC2"],
    });

    expect(evidence.length).toBeGreaterThan(0);

    // Should have both HIPAA and SOC2 controls
    const hipaaControls = evidence.filter((e) => e.framework === "HIPAA");
    const soc2Controls = evidence.filter((e) => e.framework === "SOC2");

    expect(hipaaControls.length).toBeGreaterThan(0);
    expect(soc2Controls.length).toBeGreaterThan(0);

    // Check HIPAA-specific control IDs
    const hipaaControlIds = hipaaControls.map((e) => e.control_id);
    expect(hipaaControlIds).toContain("HIPAA-164.308(a)(1)");
    expect(hipaaControlIds).toContain("HIPAA-164.312(a)(1)");
  });

  it("generates PCI-DSS controls for finance industry", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-tenant-789",
      industry: "finance",
      employeeCount: 200,
      frameworks: ["PCI-DSS"],
    });

    const pciControls = evidence.filter((e) => e.framework === "PCI-DSS");
    expect(pciControls.length).toBeGreaterThan(0);

    // Check PCI-specific control IDs
    const pciControlIds = pciControls.map((e) => e.control_id);
    expect(pciControlIds).toContain("PCI-8.1");
    expect(pciControlIds).toContain("PCI-10.1");
  });

  it("generates ISO27001 controls for technology industry", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-tenant-abc",
      industry: "technology",
      employeeCount: 150,
      frameworks: ["ISO27001"],
    });

    const isoControls = evidence.filter((e) => e.framework === "ISO27001");
    expect(isoControls.length).toBeGreaterThan(0);

    // Check ISO-specific control IDs
    const isoControlIds = isoControls.map((e) => e.control_id);
    expect(isoControlIds).toContain("A.9.2.1");
    expect(isoControlIds).toContain("A.12.1.1");
  });

  it("adjusts confidence based on employee count", () => {
    const smallCompany = generateSyntheticEvidence({
      tenantId: "small",
      industry: "technology",
      employeeCount: 10,
      frameworks: ["SOC2"],
    });

    const largeCompany = generateSyntheticEvidence({
      tenantId: "large",
      industry: "technology",
      employeeCount: 1000,
      frameworks: ["SOC2"],
    });

    // Small companies should have higher confidence (simpler setups)
    const smallAvgConfidence =
      smallCompany.reduce((sum, e) => sum + e.data.estimated_confidence, 0) / smallCompany.length;
    const largeAvgConfidence =
      largeCompany.reduce((sum, e) => sum + e.data.estimated_confidence, 0) / largeCompany.length;

    expect(smallAvgConfidence).toBeGreaterThan(largeAvgConfidence);
  });

  it("generates multiple evidence items per control", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-multi",
      industry: "technology",
      employeeCount: 50,
      frameworks: ["SOC2"],
    });

    // Group by control_id
    const controlGroups = evidence.reduce(
      (acc, e) => {
        if (!acc[e.control_id]) acc[e.control_id] = [];
        acc[e.control_id].push(e);
        return acc;
      },
      {} as Record<string, typeof evidence>,
    );

    // Each control should have multiple evidence items
    Object.values(controlGroups).forEach((group) => {
      expect(group.length).toBeGreaterThanOrEqual(3);
      expect(group.length).toBeLessThanOrEqual(7);
    });
  });

  it("spreads evidence timestamps over last 90 days", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-timestamps",
      industry: "technology",
      employeeCount: 50,
      frameworks: ["SOC2"],
    });

    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    evidence.forEach((e) => {
      const timestamp = new Date(e.collected_at).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(ninetyDaysAgo);
      expect(timestamp).toBeLessThanOrEqual(now);
    });
  });

  it("defaults to SOC2 if no frameworks specified", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-default",
      industry: "technology",
      employeeCount: 50,
    });

    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.every((e) => e.framework === "SOC2" || e.framework === "ISO27001")).toBe(true);
  });

  it("defaults to 50 employees if not specified", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-default-emp",
      industry: "technology",
      frameworks: ["SOC2"],
    });

    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.every((e) => e.data.employee_count === 50)).toBe(true);
  });

  it("includes industry in evidence data", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-industry",
      industry: "healthcare",
      employeeCount: 75,
      frameworks: ["HIPAA"],
    });

    expect(evidence.every((e) => e.data.industry === "healthcare")).toBe(true);
  });

  it("generates unique evidence IDs", () => {
    const evidence = generateSyntheticEvidence({
      tenantId: "test-unique",
      industry: "technology",
      employeeCount: 50,
      frameworks: ["SOC2"],
    });

    const ids = evidence.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
