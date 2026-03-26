const counters = new Map<string, number>();

// Latency histograms (simple fixed-bucket + raw samples for quantiles)
interface Histogram {
  buckets: number[]; // upper bounds in ms
  counts: number[]; // same length
  samples: number[]; // capped sample list for quantile approximation
  count: number;
  sum: number;
}

const histograms = new Map<string, Histogram>();

function getOrCreateHistogram(name: string): Histogram {
  let h = histograms.get(name);
  if (!h) {
    h = {
      buckets: [
        5, 10, 20, 30, 50, 75, 100, 150, 250, 400, 600, 1000, 2000, 5000,
      ],
      counts: [],
      samples: [],
      count: 0,
      sum: 0,
    };
    h.counts = new Array(h.buckets.length).fill(0);
    histograms.set(name, h);
  }
  return h;
}

export function recordLatency(name: string, durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  const h = getOrCreateHistogram(name);
  h.count++;
  h.sum += durationMs;
  for (let i = 0; i < h.buckets.length; i++) {
    if (durationMs <= h.buckets[i]) {
      h.counts[i]++;
      break;
    }
  }
  if (h.samples.length < 500) {
    h.samples.push(durationMs);
  } else if (Math.random() < 0.05) {
    // reservoir sample replacement
    const idx = Math.floor(Math.random() * h.samples.length);
    h.samples[idx] = durationMs;
  }
}

function percentile(samples: number[], p: number): number | null {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  const weight = rank - low;
  return sorted[low] + (sorted[high] - sorted[low]) * weight;
}

export function summarizeLatency(name: string) {
  const h = histograms.get(name);
  if (!h) return null;
  const p50 = percentile(h.samples, 50);
  const p95 = percentile(h.samples, 95);
  return {
    count: h.count,
    avg: h.count ? h.sum / h.count : 0,
    p50: p50 ?? 0,
    p95: p95 ?? 0,
  };
}

export function summarizeAllLatency() {
  const out: Record<string, ReturnType<typeof summarizeLatency>> = {};
  for (const key of histograms.keys()) {
    out[key] = summarizeLatency(key);
  }
  return out;
}

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
