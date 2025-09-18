import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateAdapter } from "../packages/adapter-gen/src/generator";

const root = path.resolve(process.cwd());

async function createWorkspace() {
  return mkdtemp(path.join(os.tmpdir(), "atlasit-adapter-"));
}

describe("adapter generator", () => {
  let workspace: string;
  const schemaPath = path.join(root, "contracts/examples/example-openapi.json");
  const templatesDir = path.join(root, "templates/worker");
  const registryFile = () => path.join(workspace, "registry.json");

  beforeAll(async () => {
    workspace = await createWorkspace();
  });

  afterAll(async () => {
    if (workspace) {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("creates scaffolding and registry entry", async () => {
    const result = await generateAdapter({
      schemaPath,
      name: "Example HR Suite",
      outDir: workspace,
      templatesDir,
      registryPath: registryFile(),
    });

    expect(result.slug).toBe("example-hr-suite");
    expect(result.featureFlag).toBe("FEATURE_CONNECTOR_EXAMPLE_HR_SUITE");

    const manifestPath = path.join(result.targetDir, "atlasit.adapter.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest.featureFlag).toBe(result.featureFlag);

    const registry = JSON.parse(await readFile(registryFile(), "utf8"));
    expect(registry).toHaveLength(1);
    expect(registry[0].slug).toBe(result.slug);
  });

  it("refuses to overwrite without force", async () => {
    await expect(
      generateAdapter({
        schemaPath,
        name: "Example HR Suite",
        outDir: workspace,
        templatesDir,
        registryPath: registryFile(),
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("recreates scaffolding when force is enabled", async () => {
    const regenerated = await generateAdapter({
      schemaPath,
      name: "Example HR Suite",
      outDir: workspace,
      templatesDir,
      registryPath: registryFile(),
      force: true,
    });

    expect(regenerated.targetDir.endsWith("example-hr-suite")).toBe(true);
  });
});
