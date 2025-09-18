import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeDocs } from "../packages/research-engine/src/normalizer";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");

async function loadFixture(name: string) {
  const file = path.join(root, "research", "raw", name);
  return readFile(file, "utf8");
}

describe("research normalizer", () => {
  it("produces structured schema with entities and operations", async () => {
    const markdown = await loadFixture("example-hr-suite.md");
    const schema = normalizeDocs({
      content: markdown,
      sourcePath: "research/raw/example-hr-suite.md",
      serviceName: "Example HR Suite",
    });

    expect(schema.kind).toBe("atlasit.research-schema");
    expect(schema.service.slug).toBe("example-hr-suite");
    expect(schema.entities).toHaveLength(2);
    expect(schema.entities[0]?.fields).not.toHaveLength(0);
    expect(Object.keys(schema.openapi.paths ?? {})).toContain("/employees");
    expect(schema.openapi.paths?.["/employees"]?.get?.responses?.[200]).toBeDefined();
  });
});
