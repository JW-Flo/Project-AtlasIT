import { describe, expect, it } from "vitest";
import { resolveDemoTenantConfig } from "$lib/server/demoTenant";

describe("resolveDemoTenantConfig", () => {
  it("returns null for missing/weak password", () => {
    expect(resolveDemoTenantConfig({ DEMO_SEEDED_PASSWORD: "short" })).toBeNull();
  });

  it("parses valid config", () => {
    const config = resolveDemoTenantConfig({
      DEMO_SEEDED_EMAIL: "demo@atlasit.pro",
      DEMO_SEEDED_PASSWORD: "StrongDemoPass2026!",
      DEMO_TENANT_ID: "demo-acme-dental",
      DEMO_TENANT_NAME: "Acme Dental Group",
    });
    expect(config).toEqual({
      email: "demo@atlasit.pro",
      password: "StrongDemoPass2026!",
      tenantId: "demo-acme-dental",
      tenantName: "Acme Dental Group",
    });
  });
});
