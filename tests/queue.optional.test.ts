import { describe, it, expect } from "vitest";
import fs from "node:fs";

const raw = fs.readFileSync("wrangler.toml", "utf8");

const queuesPlanned =
  raw.includes("# [[queues.producers]]") &&
  raw.includes("ATLAS_WORKFLOW_QUEUE");

describe("queues (optional until plan upgrade)", () => {
  it("documents planned queues", () => {
    expect(queuesPlanned).toBe(true);
  });

  it("is skipped for runtime enqueue tests until upgrade", () => {
    if (!process.env.CF_QUEUES_ENABLED) {
      expect(true).toBe(true); // placeholder no-op
    }
  });
});
