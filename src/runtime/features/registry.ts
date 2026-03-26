import { log } from "../log";
import { register, list } from "../registry/registry";
import type { FeatureKind, RegisteredItem } from "../registry/types";
import type { ScanFeature, JobFeature, DataProviderFeature } from "./types";

type AnyFeatureInput =
  | ScanFeature
  | JobFeature
  | DataProviderFeature
  | RegisteredItem;

export function registerFeature<T extends AnyFeatureInput>(feature: T): void {
  const validation = validateFeature(feature);
  if (!validation.valid) {
    log("warn", "feature.invalid", {
      id: feature.id,
      kind: feature.kind,
      reason: validation.reason,
    });
    return;
  }

  register(toRegisteredItem(feature));
}

export function getFeatures(kind?: FeatureKind): ReadonlyArray<RegisteredItem> {
  const snapshot = kind ? list(kind) : list();
  return Object.freeze([...snapshot]) as ReadonlyArray<RegisteredItem>;
}

function validateFeature(feature: AnyFeatureInput): {
  valid: boolean;
  reason?: string;
} {
  if (!feature.id) {
    return { valid: false, reason: "missing-id" };
  }
  if (!feature.kind) {
    return { valid: false, reason: "missing-kind" };
  }

  if (feature.kind === "scan") {
    const scan = feature as ScanFeature;
    if (typeof scan.run !== "function") {
      return { valid: false, reason: "scan-missing-run" };
    }
  }

  return { valid: true };
}

function toRegisteredItem(feature: AnyFeatureInput): RegisteredItem {
  const common: RegisteredItem = {
    id: feature.id,
    kind: feature.kind,
    version: feature.version,
    meta: feature.meta,
    deps: feature.deps ? [...feature.deps] : undefined,
    provides: feature.provides ? [...feature.provides] : undefined,
    requires: feature.requires ? [...feature.requires] : undefined,
    activate: feature.activate,
    deactivate: feature.deactivate,
    health: feature.health,
    run: (feature as Partial<ScanFeature | JobFeature>).run,
  };
  // Preserve job schedule or data fetch handlers on the object so type guards work at runtime.
  if ((feature as Partial<JobFeature>).schedule) {
    (common as any).schedule = (feature as JobFeature).schedule;
  }
  if ((feature as Partial<DataProviderFeature>).fetch) {
    (common as any).fetch = (feature as DataProviderFeature).fetch;
  }
  return common;
}
