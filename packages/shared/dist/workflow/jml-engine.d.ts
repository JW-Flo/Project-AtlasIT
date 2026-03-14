/**
 * JMLEngine — Durable Object workflow orchestrator.
 *
 * Persists run state in DO storage, executes steps sequentially with bounded
 * retries, and routes exhausted failures to a DLQ. Uses DO alarms for
 * scheduled wake-ups (not external crons).
 *
 * Design invariants:
 *  - State is versioned (schemaVersion field) for forward-compatible migration.
 *  - All state mutations are persisted before returning.
 *  - Step execution is deterministic given the same context and step registry.
 *  - Cloudflare-specific types do not leak into this module — the constructor
 *    accepts a portable storage interface.
 */
export interface WorkflowStorage {
  put(key: string, value: unknown): Promise<void>;
  get<T = unknown>(key: string): Promise<T | undefined>;
  list(opts?: { prefix?: string }): Promise<Map<string, unknown>>;
}
export interface WorkflowDOState {
  storage: WorkflowStorage;
}
export declare class JMLEngine {
  private readonly storage;
  private readonly maxRetries;
  constructor(state: WorkflowDOState, _env?: Record<string, unknown>);
  /**
   * Enqueue a new workflow run.
   *
   * Accepts the full context payload (type, tenantId, user, etc.), creates
   * the run state, persists it, executes all steps synchronously (alarm-driven
   * in production), and returns the final result.
   */
  handleEnqueue(context: Record<string, unknown>): Promise<Response>;
  /**
   * Alarm handler — called by DO runtime on scheduled wake-up.
   * Resumes execution of the current run.
   */
  alarm(): Promise<void>;
  private executeRun;
  private executeStepWithRetries;
  private jsonResponse;
}
//# sourceMappingURL=jml-engine.d.ts.map
