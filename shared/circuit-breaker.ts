// Simple circuit breaker for external calls (AI/model endpoints)
// State is in-memory per worker instance (ephemeral). Good enough for edge scale.

export interface BreakerOptions {
  failureThreshold?: number; // consecutive failures to open
  resetTimeoutMs?: number; // time before attempting half-open
  rollingWindowMs?: number; // not fully implemented; placeholder for future metrics
  name?: string;
}

export type BreakerState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private failures = 0;
  private state: BreakerState = "closed";
  private openedAt = 0;
  constructor(private opts: BreakerOptions = {}) {}

  private threshold() {
    return this.opts.failureThreshold ?? 3;
  }
  private resetTimeout() {
    return this.opts.resetTimeoutMs ?? 15000;
  }

  status(): BreakerState {
    if (
      this.state === "open" &&
      Date.now() - this.openedAt > this.resetTimeout()
    ) {
      this.state = "half-open";
    }
    return this.state;
  }

  async exec<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const st = this.status();
    if (st === "open") {
      if (fallback) return fallback();
      throw new Error("circuit-open");
    }
    try {
      const result = await fn();
      // success path
      this.failures = 0;
      if (this.state === "half-open") this.state = "closed";
      return result;
    } catch (e) {
      this.failures += 1;
      if (this.failures >= this.threshold()) {
        this.state = "open";
        this.openedAt = Date.now();
      }
      if (fallback && this.state !== "closed") {
        try {
          return await fallback();
        } catch {
          /* swallow */
        }
      }
      throw e;
    }
  }
}

// Shared singleton registry by name (per instance)
const registry = new Map<string, CircuitBreaker>();
export function getBreaker(name: string, opts?: BreakerOptions) {
  let b = registry.get(name);
  if (!b) {
    b = new CircuitBreaker(opts);
    registry.set(name, b);
  }
  return b;
}
