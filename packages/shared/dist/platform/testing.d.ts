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
//# sourceMappingURL=testing.d.ts.map
