/**
 * Platform abstraction interfaces.
 *
 * These portable contracts decouple business logic from Cloudflare-specific
 * primitives. Any runtime (Workers, Node, test harness) can provide concrete
 * implementations.
 */
export interface PublishOptions {
  /** Delay delivery by this many seconds (queue-level, not transport-level). */
  delaySec?: number;
}
export interface QueueBus {
  publish(queue: string, msg: unknown, opts?: PublishOptions): Promise<void>;
}
export interface WorkflowStateStore {
  getRun(runId: string): Promise<unknown | null>;
  putRun(runId: string, state: unknown): Promise<void>;
}
export interface EvidenceStore {
  putObject(
    path: string,
    body: Uint8Array,
    meta: Record<string, string>,
  ): Promise<{
    uri: string;
  }>;
}
export interface PolicyEvaluator {
  evaluate(input: unknown): Promise<{
    decision: unknown;
    decisionId: string;
    bundleRevision: string;
  }>;
}
export interface SecretResolver {
  resolve(secretRef: string): Promise<Uint8Array>;
}
export interface ConnectorInvoker {
  invoke(workerName: string, req: Request): Promise<Response>;
}
//# sourceMappingURL=interfaces.d.ts.map
