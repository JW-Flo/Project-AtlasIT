/**
 * In-memory implementations of platform interfaces for testing.
 *
 * These are NOT shipped to production bundles. They enable fast, isolated
 * unit tests without needing Cloudflare bindings.
 */
import type {
  QueueBus,
  PublishOptions,
  WorkflowStateStore,
  EvidenceStore,
  EvidenceWriteResult,
  EvidenceReadResult,
} from "./interfaces.js";
export interface PublishedMessage {
  queue: string;
  msg: unknown;
  opts?: PublishOptions;
  publishedAt: string;
}
export declare class InMemoryQueueBus implements QueueBus {
  readonly messages: PublishedMessage[];
  publish(queue: string, msg: unknown, opts?: PublishOptions): Promise<void>;
  /** Return messages published to a specific queue. */
  getMessages(queue: string): PublishedMessage[];
  clear(): void;
}
export declare class InMemoryWorkflowStateStore implements WorkflowStateStore {
  private readonly store;
  getRun(runId: string): Promise<unknown | null>;
  putRun(runId: string, state: unknown): Promise<void>;
  /** Diagnostic: return all stored run IDs. */
  getAllRunIds(): string[];
  clear(): void;
}
export interface StoredEvidence {
  tenantId: string;
  runId: string;
  stepId: string;
  hash: string;
  body: string;
}
export declare class InMemoryEvidenceStore implements EvidenceStore {
  private readonly store;
  exists(key: string): Promise<boolean>;
  put(
    tenantId: string,
    runId: string,
    stepId: string,
    hash: string,
    body: string,
  ): Promise<EvidenceWriteResult>;
  get(key: string): Promise<EvidenceReadResult | null>;
  /** Return all stored evidence entries for inspection in tests. */
  getAll(): StoredEvidence[];
  /** Return evidence entries for a specific run. */
  getByRun(runId: string): StoredEvidence[];
  clear(): void;
}
//# sourceMappingURL=testing.d.ts.map
