import { getFeatures, registerFeature } from "../features/registry";
import type { ScanFeature } from "./types";

export function registerScanModule<T extends ScanFeature>(feature: T): T {
  registerFeature(feature);
  return feature;
}

export function getScanFeature(id: string): ScanFeature | undefined {
  return getFeatures("scan").find((item) => item.id === id) as
    | ScanFeature
    | undefined;
}

export function getScanFeatures(): ScanFeature[] {
  return getFeatures("scan") as ScanFeature[];
}
