const counters = new Map<string, number>();

export function incrementCounter(name: string, delta = 1) {
  const current = counters.get(name) ?? 0;
  counters.set(name, current + delta);
}

export function getCounter(name: string): number {
  return counters.get(name) ?? 0;
}

export function drainCounters(): Record<string, number> {
  if (counters.size === 0) return {};
  const snapshot: Record<string, number> = {};
  counters.forEach((value, key) => {
    snapshot[key] = value;
  });
  counters.clear();
  return snapshot;
}

export function hasCounters(): boolean {
  return counters.size > 0;
}
