import { describe, expect, it } from "vitest";
import { generateAdapter } from "../../packages/adapter-gen/src/generator";
import { SLACK_MANIFEST } from "../../packages/connector-schema/src/templates";

describe("adapter generator manifest pipeline", () => {
  it("generates deployable worker scaffolding from ConnectorManifest", () => {
    const generated = generateAdapter(SLACK_MANIFEST);

    expect(generated.files.has("src/index.ts")).toBe(true);
    expect(generated.files.has("migrations/0001_initial.sql")).toBe(true);
    expect(generated.files.has("README.md")).toBe(true);

    const worker = generated.files.get("src/index.ts") ?? "";
    expect(worker).toContain("X-Content-Type-Options");
    expect(worker).toContain("Rate limit exceeded");
  });
});
