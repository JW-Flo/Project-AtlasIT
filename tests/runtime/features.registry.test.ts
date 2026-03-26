import { beforeEach, describe, expect, it, vi } from "vitest";
import { initRegistry, getSnapshot } from "../../src/runtime/registry/registry";
import {
  registerFeature,
  getFeatures,
} from "../../src/runtime/features/registry";

beforeEach(() => {
  initRegistry();
  vi.restoreAllMocks();
});

describe("feature registry", () => {
  it("registers feature and increments version", () => {
    const before = getSnapshot();
    registerFeature({ id: "example-job", kind: "job", version: "1.0.0" });
    const after = getSnapshot();

    expect(after.version).toBeGreaterThan(before.version);
    const jobs = getFeatures("job");
    expect(jobs.some((feature) => feature.id === "example-job")).toBe(true);
  });

  it("suppresses duplicate registrations", () => {
    registerFeature({
      id: "dupe-scan",
      kind: "scan",
      version: "1.0.0",
      run: async () => ({ findings: [] }),
    });
    registerFeature({
      id: "dupe-scan",
      kind: "scan",
      version: "1.0.1",
      run: async () => ({ findings: [] }),
    });

    const scans = getFeatures("scan");
    const entries = scans.filter((feature) => feature.id === "dupe-scan");
    expect(entries).toHaveLength(1);
  });

  it("skips invalid scan feature missing run", () => {
    registerFeature({ id: "invalid-scan", kind: "scan" } as any);
    const scans = getFeatures("scan");
    expect(scans.some((feature) => feature.id === "invalid-scan")).toBe(false);
  });
});
