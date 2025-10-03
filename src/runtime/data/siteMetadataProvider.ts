import { registerFeature } from "../features/registry";
import { getSnapshot } from "../registry/registry";

registerFeature({
  id: "site-metadata",
  kind: "data",
  version: "0.1.0",
  meta: { description: "Provides basic site/runtime metadata" },
  // @ts-ignore - fetch typed on DataProviderFeature
  async fetch() {
    const snapshot = getSnapshot();
    return {
      generatedAt: new Date().toISOString(),
      registry: {
        version: snapshot.version,
        counts: snapshot.counts,
        sourceHash: snapshot.sourceHash,
      },
    };
  },
});
