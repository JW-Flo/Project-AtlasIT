/**
 * Platform abstraction interfaces.
 *
 * These portable contracts decouple business logic from Cloudflare-specific
 * primitives. Any runtime (Workers, Node, test harness) can provide concrete
 * implementations.
 */

// ---------------------------------------------------------------------------
// QueueBus — publish messages to named queues with optional delay
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** Delay delivery by this many seconds (queue-level, not transport-level). */
  delaySec?: number;
}

export interface QueueBus {
  publish(queue: string, msg: unknown, opts?: PublishOptions): Promise<void>;
}

// ---------------------------------------------------------------------------
// WorkflowStateStore — persist and retrieve workflow run state
// ---------------------------------------------------------------------------

export interface WorkflowStateStore {
  getRun(runId: string): Promise<unknown | null>;
  putRun(runId: string, state: unknown): Promise<void>;
}

// ---------------------------------------------------------------------------
// EvidenceStore — write immutable evidence objects
// ---------------------------------------------------------------------------

export interface EvidenceStore {
  putObject(
    path: string,
    body: Uint8Array,
    meta: Record<string, string>,
  ): Promise<{ uri: string }>;
}

// ---------------------------------------------------------------------------
// PolicyEvaluator — evaluate input against policy bundles
// ---------------------------------------------------------------------------

export interface PolicyEvaluator {
  evaluate(input: unknown): Promise<{
    decision: unknown;
    decisionId: string;
    bundleRevision: string;
  }>;
}

// ---------------------------------------------------------------------------
// SecretResolver — resolve secret references to raw values
// ---------------------------------------------------------------------------

export interface SecretResolver {
  resolve(secretRef: string): Promise<Uint8Array>;
}

// ---------------------------------------------------------------------------
// ConnectorInvoker — dispatch work to named connector workers
// ---------------------------------------------------------------------------

export interface ConnectorInvoker {
  invoke(workerName: string, req: Request): Promise<Response>;
}
