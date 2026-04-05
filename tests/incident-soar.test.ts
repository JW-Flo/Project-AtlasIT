import { describe, it, expect } from "vitest";
import {
  type SoarProvider,
  type SoarIncident,
  type SoarConfig,
  PagerDutyStub,
  OpsgenieStub,
  ServiceNowStub,
  createSoarProvider,
  SUPPORTED_PROVIDERS,
} from "../packages/shared/src/incidents/soar";

const sampleIncident: SoarIncident = {
  id: "inc-001",
  title: "Production database unreachable",
  severity: "critical",
  status: "open",
  description: "Primary DB cluster is not responding to health checks",
  ownerEmail: "oncall@example.com",
  createdAt: "2026-04-01T10:00:00Z",
  tenantId: "tenant-1",
};

describe("SOAR integration stubs", () => {
  describe("PagerDutyStub", () => {
    it("implements SoarProvider interface", () => {
      const pd = new PagerDutyStub();
      expect(pd.name).toBe("pagerduty");
      expect(typeof pd.createIncident).toBe("function");
      expect(typeof pd.updateIncident).toBe("function");
      expect(typeof pd.resolveIncident).toBe("function");
      expect(typeof pd.acknowledge).toBe("function");
    });

    it("createIncident returns stub response with external ID", async () => {
      const pd = new PagerDutyStub();
      const result = await pd.createIncident(sampleIncident);
      expect(result.success).toBe(true);
      expect(result.externalId).toMatch(/^stub-pd-/);
      expect(result.provider).toBe("pagerduty");
    });

    it("acknowledge returns stub response", async () => {
      const pd = new PagerDutyStub();
      const result = await pd.acknowledge("ext-123");
      expect(result.success).toBe(true);
    });

    it("resolveIncident returns stub response", async () => {
      const pd = new PagerDutyStub();
      const result = await pd.resolveIncident("ext-123");
      expect(result.success).toBe(true);
    });
  });

  describe("OpsgenieStub", () => {
    it("implements SoarProvider interface", () => {
      const og = new OpsgenieStub();
      expect(og.name).toBe("opsgenie");
    });

    it("createIncident returns stub response", async () => {
      const og = new OpsgenieStub();
      const result = await og.createIncident(sampleIncident);
      expect(result.success).toBe(true);
      expect(result.externalId).toMatch(/^stub-og-/);
      expect(result.provider).toBe("opsgenie");
    });
  });

  describe("ServiceNowStub", () => {
    it("implements SoarProvider interface", () => {
      const sn = new ServiceNowStub();
      expect(sn.name).toBe("servicenow");
    });

    it("createIncident returns stub response", async () => {
      const sn = new ServiceNowStub();
      const result = await sn.createIncident(sampleIncident);
      expect(result.success).toBe(true);
      expect(result.externalId).toMatch(/^stub-sn-/);
      expect(result.provider).toBe("servicenow");
    });
  });

  describe("createSoarProvider factory", () => {
    it("creates PagerDuty provider", () => {
      const config: SoarConfig = { provider: "pagerduty", apiKey: "test-key", enabled: true };
      const provider = createSoarProvider(config);
      expect(provider.name).toBe("pagerduty");
    });

    it("creates Opsgenie provider", () => {
      const config: SoarConfig = { provider: "opsgenie", apiKey: "test-key", enabled: true };
      const provider = createSoarProvider(config);
      expect(provider.name).toBe("opsgenie");
    });

    it("creates ServiceNow provider", () => {
      const config: SoarConfig = { provider: "servicenow", apiKey: "test-key", enabled: true };
      const provider = createSoarProvider(config);
      expect(provider.name).toBe("servicenow");
    });

    it("throws for unsupported provider", () => {
      const config: SoarConfig = { provider: "unknown" as any, apiKey: "test", enabled: true };
      expect(() => createSoarProvider(config)).toThrow("Unsupported SOAR provider");
    });
  });

  describe("SUPPORTED_PROVIDERS", () => {
    it("lists all supported providers", () => {
      expect(SUPPORTED_PROVIDERS).toEqual(["pagerduty", "opsgenie", "servicenow"]);
    });
  });
});
