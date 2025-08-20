import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";

// Ensures migration drift is detected by comparing committed schema.hash with freshly computed hash
describe("schema hash integrity", () => {
  it("matches committed schema.hash", () => {
    const repoRoot = process.cwd();
    const committed = readFileSync(
      path.join(repoRoot, "schema.hash"),
      "utf-8",
    ).trim();
    const output = execSync("node scripts/schema-hash.js", {
      encoding: "utf-8",
    });
    const parsed = JSON.parse(output);
    expect(parsed.hash).toBe(committed);
  });
});
