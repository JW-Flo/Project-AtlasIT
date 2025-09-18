import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { writeArtifact } from "../src/lib/artifacts.js";
import os from "node:os";
import path from "node:path";

describe("writeArtifact", () => {
  it("creates directories and writes string content", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "atlasit-artifacts-"));
    const cwd = process.cwd();
    try {
      process.chdir(tmp);
      const location = await writeArtifact("task-abc", "output.log", "hello\n");
      expect(location.endsWith("artifacts/task-abc/output.log")).toBe(true);
      const content = await readFile(location, "utf8");
      expect(content).toBe("hello\n");
    } finally {
      process.chdir(cwd);
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("serializes objects to JSON", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "atlasit-artifacts-json-"));
    const cwd = process.cwd();
    try {
      process.chdir(tmp);
      const output = await writeArtifact("task-json", "RUN.json", { ok: true });
      const raw = await readFile(output, "utf8");
      expect(raw.trim()).toBe('{\n  "ok": true\n}');
    } finally {
      process.chdir(cwd);
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
