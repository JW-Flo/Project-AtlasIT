export type FeatureKind =
  | "api"
  | "scan"
  | "job"
  | "data"
  | "ui"
  | "enricher"
  | "workflow"
  | "channel"
  | "flag";

export interface RegisteredItem<TMeta = unknown> {
  id: string;
  kind: FeatureKind;
  version?: string;
  meta?: TMeta;
  activate?: (ctx: unknown) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
  enabled?: boolean;
  deps?: string[];
  provides?: string[];
  requires?: string[];
  health?: (
    ctx: unknown,
  ) => Promise<{ status: "ok" | "warn" | "err"; details?: unknown }>;
  run?: (...args: unknown[]) => unknown;
}

export interface RegistrySnapshot {
  version: number;
  counts: Record<FeatureKind, number>;
  items: ReadonlyArray<RegisteredItem>;
  createdAt: number;
  sourceHash: string;
}

export const FEATURE_KINDS: ReadonlyArray<FeatureKind> = [
  "api",
  "scan",
  "job",
  "data",
  "ui",
  "enricher",
  "workflow",
  "channel",
  "flag",
];
