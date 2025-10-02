import { log } from "../log";
import { list } from "../registry/registry";
import type { RegisteredItem } from "../registry/types";
import { isJobFeature } from "../features/types";

interface JobStats {
  id: string;
  runs: number;
  errors: number;
  lastError?: string;
  lastRunAt?: number;
  avgMs: number;
  totalMs: number;
}

interface SchedulerState {
  started: boolean;
  stats: Record<string, JobStats>;
  timers: Record<string, any>;
  startTime?: number;
}

const state: SchedulerState = {
  started: false,
  stats: {},
  timers: {},
};

export interface SchedulerSnapshot {
  started: boolean;
  uptimeMs: number;
  jobs: JobStats[];
  version: number;
  capturedAt: number;
}

let snapshotVersion = 0;

function ensureJobStats(id: string): JobStats {
  if (!state.stats[id]) {
    state.stats[id] = { id, runs: 0, errors: 0, avgMs: 0, totalMs: 0 };
  }
  return state.stats[id];
}

async function runJob(
  item: RegisteredItem & {
    run?: (ctx: unknown) => Promise<unknown>;
    schedule?: { intervalMs: number };
  },
) {
  const stats = ensureJobStats(item.id);
  const started = Date.now();
  try {
    await item.run?.({});
  } catch (err: any) {
    stats.errors += 1;
    stats.lastError = err?.message || String(err);
    log("error", "job.run.error", { id: item.id, error: stats.lastError });
  } finally {
    const dur = Date.now() - started;
    stats.runs += 1;
    stats.lastRunAt = Date.now();
    stats.totalMs += dur;
    stats.avgMs = stats.totalMs / stats.runs;
  }
}

function scheduleJob(
  item: RegisteredItem & {
    run?: (ctx: unknown) => Promise<unknown>;
    schedule?: { intervalMs: number };
  },
) {
  const interval = (item as any).schedule?.intervalMs;
  if (!interval || interval <= 0) return;
  if (state.timers[item.id]) return; // already scheduled

  // First run is delayed until first interval to avoid cold start burst
  state.timers[item.id] = setInterval(() => {
    runJob(item);
  }, interval);
  // Avoid keeping process alive in Node-like envs
  // Optional in Node environments; harmless elsewhere.
  // Attempt to avoid keeping process alive if environment supports it.
  // (ts-ignore used to avoid type dependency on Node types within edge builds)
  // @ts-ignore
  state.timers[item.id].unref?.();
}

export function startScheduler(): void {
  if (state.started) return;
  state.started = true;
  state.startTime = Date.now();
  const jobs = list("job").filter(isJobFeature as any);
  for (const job of jobs) {
    scheduleJob(job as any);
  }
  log("info", "scheduler.started", { jobs: jobs.length });
}

export function schedulerSnapshot(): SchedulerSnapshot {
  snapshotVersion += 1;
  return {
    started: state.started,
    uptimeMs: state.startTime ? Date.now() - state.startTime : 0,
    jobs: Object.values(state.stats),
    version: snapshotVersion,
    capturedAt: Date.now(),
  };
}

export function getJobStats(): Record<string, JobStats> {
  return state.stats;
}
