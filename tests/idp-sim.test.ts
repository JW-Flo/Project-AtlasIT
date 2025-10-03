import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runSimulation } from "../packages/idp-sim/src/cli.ts";

const originalCwd = process.cwd();
let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "idp-sim-"));
  process.chdir(tempDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
});

describe("idp simulator", () => {
  it("writes log, junit, and run metadata", async () => {
    await runSimulation();
    const log = await readFile("artifacts/idp/sim.log", "utf8");
    expect(log).toContain("adapter:");
    const junit = await readFile("artifacts/idp/junit.xml", "utf8");
    expect(junit).toContain("testsuite");
    const runMeta = await readFile("artifacts/idp/RUN.json", "utf8");
    const metadata = JSON.parse(runMeta);
    expect(metadata.ok).toBe(true);
  });
});
