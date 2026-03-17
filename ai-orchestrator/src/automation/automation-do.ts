/**
 * Durable Object for per-tenant automation state management.
 *
 * Responsibilities:
 * - Execution deduplication (prevent duplicate rule firings within a window)
 * - Rate limiting (cap rule executions per time window)
 * - Cooldown tracking (enforce minimum interval between rule fires)
 * - Execution counters for observability
 */

interface AutomationState {
  /** Map of ruleId → last execution timestamp */
  lastExecutions: Record<string, number>;
  /** Map of ruleId → execution count within the current window */
  windowCounts: Record<string, number>;
  /** Current window start timestamp */
  windowStart: number;
  /** Dedup keys with expiry timestamps */
  dedupKeys: Record<string, number>;
}

interface CheckResult {
  allowed: boolean;
  reason?: string;
  ruleId: string;
}

const DEFAULT_COOLDOWN_MS = 60_000; // 1 minute between same rule fires
const DEFAULT_WINDOW_MS = 3_600_000; // 1 hour window
const DEFAULT_MAX_PER_WINDOW = 100; // max 100 executions per rule per window
const DEDUP_TTL_MS = 300_000; // 5 minute dedup window

export class AutomationDO implements DurableObject {
  private state: DurableObjectState;
  private automationState: AutomationState | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async loadState(): Promise<AutomationState> {
    if (this.automationState) return this.automationState;

    const stored =
      await this.state.storage.get<AutomationState>("automation_state");
    this.automationState = stored ?? {
      lastExecutions: {},
      windowCounts: {},
      windowStart: Date.now(),
      dedupKeys: {},
    };
    return this.automationState;
  }

  private async saveState(): Promise<void> {
    if (this.automationState) {
      await this.state.storage.put("automation_state", this.automationState);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "POST" && path === "/check") {
      return this.handleCheck(request);
    }

    if (request.method === "POST" && path === "/record") {
      return this.handleRecord(request);
    }

    if (request.method === "GET" && path === "/stats") {
      return this.handleStats();
    }

    if (request.method === "POST" && path === "/reset") {
      return this.handleReset();
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Check if a rule execution is allowed (dedup + cooldown + rate limit).
   * Does NOT record the execution — call /record after successful execution.
   */
  private async handleCheck(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      ruleId: string;
      dedupKey?: string;
      cooldownMs?: number;
      maxPerWindow?: number;
    };

    const state = await this.loadState();
    const now = Date.now();
    const result: CheckResult = { allowed: true, ruleId: body.ruleId };

    // 1. Dedup check
    if (body.dedupKey) {
      const expiry = state.dedupKeys[body.dedupKey];
      if (expiry && now < expiry) {
        result.allowed = false;
        result.reason = "duplicate_event";
        return Response.json(result);
      }
    }

    // 2. Cooldown check
    const lastExec = state.lastExecutions[body.ruleId];
    const cooldownMs = body.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    if (lastExec && now - lastExec < cooldownMs) {
      result.allowed = false;
      result.reason = "cooldown_active";
      return Response.json(result);
    }

    // 3. Rate limit check (reset window if expired)
    if (now - state.windowStart > DEFAULT_WINDOW_MS) {
      state.windowCounts = {};
      state.windowStart = now;
      // Prune expired dedup keys
      for (const [key, expiry] of Object.entries(state.dedupKeys)) {
        if (now >= expiry) delete state.dedupKeys[key];
      }
    }

    const maxPerWindow = body.maxPerWindow ?? DEFAULT_MAX_PER_WINDOW;
    const currentCount = state.windowCounts[body.ruleId] ?? 0;
    if (currentCount >= maxPerWindow) {
      result.allowed = false;
      result.reason = "rate_limit_exceeded";
      return Response.json(result);
    }

    return Response.json(result);
  }

  /**
   * Record a successful execution (updates counters, dedup, cooldown).
   */
  private async handleRecord(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      ruleId: string;
      dedupKey?: string;
    };

    const state = await this.loadState();
    const now = Date.now();

    // Update last execution time
    state.lastExecutions[body.ruleId] = now;

    // Increment window counter
    state.windowCounts[body.ruleId] =
      (state.windowCounts[body.ruleId] ?? 0) + 1;

    // Store dedup key
    if (body.dedupKey) {
      state.dedupKeys[body.dedupKey] = now + DEDUP_TTL_MS;
    }

    await this.saveState();

    return Response.json({ recorded: true, ruleId: body.ruleId });
  }

  /**
   * Return current automation state for observability.
   */
  private async handleStats(): Promise<Response> {
    const state = await this.loadState();
    const now = Date.now();

    return Response.json({
      windowStart: new Date(state.windowStart).toISOString(),
      windowAgeMs: now - state.windowStart,
      ruleCounts: state.windowCounts,
      activeCooldowns: Object.entries(state.lastExecutions)
        .filter(([, ts]) => now - ts < DEFAULT_COOLDOWN_MS)
        .map(([ruleId, ts]) => ({
          ruleId,
          remainingMs: DEFAULT_COOLDOWN_MS - (now - ts),
        })),
      dedupKeysActive: Object.keys(state.dedupKeys).filter(
        (k) => now < state.dedupKeys[k],
      ).length,
    });
  }

  /**
   * Reset all state (for testing or manual intervention).
   */
  private async handleReset(): Promise<Response> {
    this.automationState = {
      lastExecutions: {},
      windowCounts: {},
      windowStart: Date.now(),
      dedupKeys: {},
    };
    await this.saveState();
    return Response.json({ reset: true });
  }
}
