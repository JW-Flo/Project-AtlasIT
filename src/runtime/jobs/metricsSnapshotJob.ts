import { registerFeature } from "../features/registry";
import { getSnapshot } from "../registry/registry";
import { schedulerSnapshot, SchedulerSnapshot } from "./scheduler";
import { log } from "../log";

interface MetricsSnapshotShape {
  capturedAt: number;
  registry: {
    version: number;
    counts: Record<string, number>;
    sourceHash: string;
  };
  scheduler: SchedulerSnapshot;
}

let lastSnapshot: MetricsSnapshotShape | null = null;

export function getLastMetricsSnapshot(): MetricsSnapshotShape | null {
  return lastSnapshot;
}

registerFeature({
  id: "metrics-snapshot",
  kind: "job",
  version: "0.1.0",
  meta: { description: "Captures periodic registry & scheduler metrics" },
  // schedule: run every 30s (lightweight)
  // exposed via schedule property but underlying registry RegisteredItem currently omits; accepted for forward compatibility.
  // @ts-ignore - schedule typed on JobFeature extension
  schedule: { intervalMs: 30000 },
  // @ts-ignore - run present on JobFeature
  async run() {
    const registry = getSnapshot();
    const scheduler = schedulerSnapshot();
    lastSnapshot = {
      capturedAt: Date.now(),
      registry: {
        version: registry.version,
        counts: registry.counts,
        sourceHash: registry.sourceHash,
      },
      scheduler,
    };
    log("info", "metrics.snapshot", {
      version: registry.version,
      jobs: scheduler.jobs.length,
    });
  },
});
