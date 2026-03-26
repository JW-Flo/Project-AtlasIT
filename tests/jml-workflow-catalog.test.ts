import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { listIntegrations } from "../shared/integrations/registry.js";
import { jmlCatalogByApp } from "../shared/integrations/jml/index.js";

const IDP_SOURCES = [
  "okta",
  "google_workspace",
  "active_directory",
  "entra_id",
] as const;

describe("JML workflow catalog coverage", () => {
  it("has connector/workflow definitions for every marketplace integration", () => {
    const integrations = listIntegrations();
    expect(integrations.length).toBeGreaterThan(0);

    for (const integration of integrations) {
      const definition = jmlCatalogByApp.get(integration.id);
      expect(definition, `missing jml for ${integration.id}`).toBeDefined();
      expect(definition?.connector?.integrationId).toBe(integration.id);
      expect(definition?.connector?.slug).toContain(integration.id);
      const joinerFile = definition?.connector?.joinerWorkflowFile;
      expect(
        joinerFile,
        `missing joiner workflow file for ${integration.id}`,
      ).toBeDefined();
      expect(
        existsSync(joinerFile as string),
        `joiner workflow file not found for ${integration.id}`,
      ).toBe(true);

      const content = readFileSync(joinerFile as string, "utf8");
      expect(content).toContain("type: joiner");
      expect(content).toContain("workflow:");
      expect(content).toContain(
        `action_ref: atlas.connectors.${integration.id}.provision_user`,
      );

      for (const idp of IDP_SOURCES) {
        expect(definition?.workflows?.[idp]?.joiner?.length).toBeGreaterThan(0);
        expect(definition?.workflows?.[idp]?.mover?.length).toBeGreaterThan(0);
        expect(definition?.workflows?.[idp]?.leaver?.length).toBeGreaterThan(0);
      }
    }
  });
});
