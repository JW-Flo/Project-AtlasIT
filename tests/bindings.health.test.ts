import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function parseToml(t) {
  // extremely small heuristic parser: split sections; only need to assert presence of lines
  return t.split(/\n/);
}

describe("infrastructure bindings (wrangler.toml)", () => {
  const file = path.join(process.cwd(), "wrangler.toml");
  const raw = fs.readFileSync(file, "utf8");
  const lines = parseToml(raw);

  it("has required D1 bindings", () => {
    const required = [
      'binding = "ATLAS_CORE_DB"',
      'binding = "ATLAS_AUDIT_DB"',
      'binding = "ATLAS_COMPLIANCE_DB"',
      'binding = "ATLAS_AUDIT_SHADOW"',
    ];
    for (const token of required) {
      expect(
        lines.some((l) => l.includes(token)),
        `missing ${token}`,
      ).toBe(true);
    }
    // ensure database_id lines present for each
    const dbIds = [
      "4fb2e312-3ba5-4fa2-a91f-7275c71bea64",
      "faa2caf5-0219-4507-9d8f-9ddab544615c",
      "f14bde38-795d-46b5-b174-fe4d559f2ac7",
      "d72ddfd9-c892-42ec-a5c3-b920788485c1",
    ];
    for (const id of dbIds) {
      expect(raw.includes(id), `missing database_id ${id}`).toBe(true);
    }
  });

  it("has required KV namespaces", () => {
    const kvBindings = ["KV_SESSIONS", "KV_CACHE", "KV_FEATURE_FLAGS"];
    kvBindings.forEach((k) => {
      expect(raw.includes(`binding = "${k}"`), `missing KV binding ${k}`).toBe(
        true,
      );
    });
  });

  it("has R2 buckets declared", () => {
    ["atlas_policies", "atlas_evidence", "atlas_artifacts"].forEach((b) => {
      expect(raw.includes(`binding = "${b}"`), `missing R2 binding ${b}`).toBe(
        true,
      );
    });
  });

  it("documents queue bindings (commented until plan upgrade)", () => {
    // Ensure commented instruction lines exist
    expect(/# \[\[queues.producers\]\]/.test(raw)).toBe(true);
    expect(raw.includes('# binding = "ATLAS_WORKFLOW_QUEUE"')).toBe(true);
  });
});
