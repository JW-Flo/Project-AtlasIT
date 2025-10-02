import { describe, it, expect } from "vitest";
import { initRegistry, getSnapshot } from "../../src/runtime/registry/registry";
// Do not import feature modules before registry re-init.

describe("health augmentation scaffolding", () => {
  it("includes job & data features without breaking snapshot", () => {
    initRegistry();
    // import after reset so they register into fresh registry
    return (async () => {
      await import("../../src/runtime/jobs/metricsSnapshotJob");
      await import("../../src/runtime/data/siteMetadataProvider");
      const snap = getSnapshot();
      expect(
        snap.items.find((i) => i.kind === "job" && i.id === "metrics-snapshot"),
      ).toBeTruthy();
      expect(
        snap.items.find((i) => i.kind === "data" && i.id === "site-metadata"),
      ).toBeTruthy();
    })();
  });
});
