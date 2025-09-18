import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { normalizeDocs } from "../packages/research-engine/src/normalizer";
import { generateAdapter } from "../packages/adapter-gen/src/generator";

async function createWorkspace() {
  return mkdtemp(path.join(os.tmpdir(), "atlasit-adapter-research-"));
}

describe("adapter generator with research schema", () => {
  it("converts research schema to openapi before scaffolding", async () => {
    const workspace = await createWorkspace();
    try {
      const rawPath = path.resolve("research/raw/example-hr-suite.md");
      const markdown = await readFile(rawPath, "utf8");
      const research = normalizeDocs({
        content: markdown,
        sourcePath: "research/raw/example-hr-suite.md",
        serviceName: "Example HR Suite",
      });

      const researchSchemaPath = path.join(workspace, "example.schema.json");
      await writeFile(researchSchemaPath, JSON.stringify(research, null, 2));

      const result = await generateAdapter({
        schemaPath: researchSchemaPath,
        name: "Example HR Suite",
        outDir: workspace,
        templatesDir: path.resolve("templates/worker"),
        registryPath: path.join(workspace, "registry.json"),
        force: true,
      });

      const storedResearch = await readFile(
        path.join(result.targetDir, "research.schema.json"),
        "utf8",
      );
      expect(JSON.parse(storedResearch).kind).toBe("atlasit.research-schema");
      const adapterSchema = JSON.parse(
        await readFile(path.join(result.targetDir, "schema.json"), "utf8"),
      );
      expect(adapterSchema.openapi).toBe("3.1.0");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
