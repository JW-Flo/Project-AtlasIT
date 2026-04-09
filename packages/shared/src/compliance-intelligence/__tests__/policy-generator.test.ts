import { describe, it, expect } from "vitest";
import { generateSecurityPolicy, type TenantContext } from "../policy-generator";

const mockEnv = {
  AI_DETERMINISTIC: "1",
};

const baseTenantContext: TenantContext = {
  tenantId: "tenant-1",
  tenantName: "Acme Corp",
  selectedFrameworks: ["SOC2", "ISO27001"],
  connectedApps: ["github", "slack", "okta"],
  automationRuleCount: 5,
  complianceScores: { SOC2: 72, ISO27001: 65 },
  evidenceSummary: "42 evidence items across 29 controls",
};

describe("generateSecurityPolicy", () => {
  it("generates an access control policy with correct structure", async () => {
    const result = await generateSecurityPolicy(mockEnv, baseTenantContext, "access_control");

    expect(result.title).toBeTruthy();
    expect(result.type).toBe("access_control");
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.generatedAt).toBeTruthy();
    expect(result.basedOn.length).toBeGreaterThan(0);
  });

  it("generates an incident response policy", async () => {
    const result = await generateSecurityPolicy(mockEnv, baseTenantContext, "incident_response");

    expect(result.type).toBe("incident_response");
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.basedOn).toContain("SOC2");
  });

  it("generates a data handling policy", async () => {
    const result = await generateSecurityPolicy(mockEnv, baseTenantContext, "data_handling");

    expect(result.type).toBe("data_handling");
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it("generates a password policy", async () => {
    const result = await generateSecurityPolicy(mockEnv, baseTenantContext, "password");

    expect(result.type).toBe("password");
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it("generates an acceptable use policy", async () => {
    const result = await generateSecurityPolicy(mockEnv, baseTenantContext, "acceptable_use");

    expect(result.type).toBe("acceptable_use");
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it("includes framework references in basedOn", async () => {
    const result = await generateSecurityPolicy(mockEnv, baseTenantContext, "access_control");

    expect(result.basedOn.some((b) => b.includes("SOC2") || b.includes("ISO27001"))).toBe(true);
  });

  it("generates different policies for different types", async () => {
    const accessPolicy = await generateSecurityPolicy(mockEnv, baseTenantContext, "access_control");
    const incidentPolicy = await generateSecurityPolicy(
      mockEnv,
      baseTenantContext,
      "incident_response",
    );

    expect(accessPolicy.title).not.toBe(incidentPolicy.title);
    expect(accessPolicy.type).not.toBe(incidentPolicy.type);
  });
});
