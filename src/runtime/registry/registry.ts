import { hashStrings } from "../util/hash";
import { log } from "../log";
import type { FeatureKind, RegisteredItem, RegistrySnapshot } from "./types";
import { FEATURE_KINDS } from "./types";

const makeKey = (kind: FeatureKind, id: string): string => `${kind}:${id}`;

let registryItems = new Map<string, RegisteredItem>();
let currentSnapshot: RegistrySnapshot | null = null;
let currentIndex = new Map<string, RegisteredItem>();
let snapshotVersion = 0;

const baseCounts = (): Record<FeatureKind, number> => {
  const counts = Object.create(null) as Record<FeatureKind, number>;
  for (const kind of FEATURE_KINDS) {
    counts[kind] = 0;
  }
  return counts;
};

const cloneArray = <T>(value?: T[]): T[] | undefined => {
  return value ? [...value] : undefined;
};

const cloneItem = (item: RegisteredItem): RegisteredItem => {
  const cloned: RegisteredItem = {
    ...item,
    deps: cloneArray(item.deps),
    provides: cloneArray(item.provides),
    requires: cloneArray(item.requires),
  };
  return Object.freeze(cloned);
};

const cloneItems = (items: Iterable<RegisteredItem>): RegisteredItem[] => {
  return Array.from(items, (item) => cloneItem(item));
};

export function initRegistry(items: RegisteredItem[] = []): void {
  registryItems = new Map();
  currentSnapshot = null;
  currentIndex = new Map();
  snapshotVersion = 0;

  for (const item of items) {
    register(item);
  }
}

export function register(item: RegisteredItem): boolean {
  if (!item.id || !item.kind) {
    throw new Error("Registered items must include both id and kind");
  }

  const key = makeKey(item.kind, item.id);
  if (registryItems.has(key)) {
    log("warn", "feature.duplicate", { id: item.id, kind: item.kind });
    log("warn", "registry.duplicate", { id: item.id, kind: item.kind });
    return false;
  }

  registryItems.set(key, {
    ...item,
    deps: cloneArray(item.deps),
    provides: cloneArray(item.provides),
    requires: cloneArray(item.requires),
  });

  currentSnapshot = null;
  currentIndex = new Map();
  log("info", "feature.registered", {
    id: item.id,
    kind: item.kind,
    version: item.version ?? "0",
    providesCount: item.provides?.length ?? 0,
  });
  return true;
}

export function buildSnapshot(): RegistrySnapshot {
  const items = cloneItems(registryItems.values());
  const counts = baseCounts();

  for (const item of items) {
    counts[item.kind] += 1;
  }

  const sourceHash = hashStrings(
    items.map((item) => {
      const provides = item.provides ? [...item.provides].sort().join("|") : "";
      return `${item.kind}:${item.id}:${item.version ?? "0"}:${provides}`;
    }),
  );

  snapshotVersion += 1;
  const snapshot: RegistrySnapshot = Object.freeze({
    version: snapshotVersion,
    counts: Object.freeze(counts),
    items: Object.freeze(items),
    createdAt: Date.now(),
    sourceHash,
  });

  currentSnapshot = snapshot;
  currentIndex = new Map(
    snapshot.items.map((item) => [makeKey(item.kind, item.id), item]),
  );

  // One-time log per snapshot build (mainly version increment) for observability.
  try {
    const countsHash = hashStrings(
      Object.entries(counts).map(([k, v]) => `${k}:${v}`),
    );
    log("info", "registry.snapshot", { version: snapshot.version, countsHash });
  } catch {
    /* logging must never throw */
  }

  return snapshot;
}

export function getSnapshot(): RegistrySnapshot {
  if (!currentSnapshot) {
    return buildSnapshot();
  }
  return currentSnapshot;
}

export function find(
  kind: FeatureKind,
  id: string,
): RegisteredItem | undefined {
  const snapshot = getSnapshot();
  return (
    currentIndex.get(makeKey(kind, id)) ??
    snapshot.items.find((item) => item.kind === kind && item.id === id)
  );
}

export function list(kind?: FeatureKind): RegisteredItem[] {
  const snapshot = getSnapshot();
  if (!kind) {
    return [...snapshot.items];
  }
  return snapshot.items.filter((item) => item.kind === kind);
}
