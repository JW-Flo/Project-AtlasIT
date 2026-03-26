import type { RegisteredItem } from "../registry/types";

// Base feature (shared shape prior to specialization)
export interface ScanFeature extends RegisteredItem {
  kind: "scan";
  run: (...args: unknown[]) => unknown;
}

export interface JobFeature extends RegisteredItem {
  kind: "job";
  schedule: { intervalMs: number };
  run: (ctx: unknown) => Promise<unknown>;
}

export interface DataProviderFeature extends RegisteredItem {
  kind: "data";
  fetch: (
    params: Record<string, unknown> | undefined,
    ctx: unknown,
  ) => Promise<unknown>;
}

export type AnyFeature =
  | ScanFeature
  | JobFeature
  | DataProviderFeature
  | RegisteredItem;

export function isScanFeature(f: RegisteredItem): f is ScanFeature {
  return f.kind === "scan" && typeof f.run === "function";
}

export function isJobFeature(f: RegisteredItem): f is JobFeature {
  return (
    f.kind === "job" &&
    typeof (f as any).run === "function" &&
    !!(f as any).schedule
  );
}

export function isDataProviderFeature(
  f: RegisteredItem,
): f is DataProviderFeature {
  return f.kind === "data" && typeof (f as any).fetch === "function";
}
