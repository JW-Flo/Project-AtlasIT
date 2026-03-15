/**
 * Cloudflare DO storage adapter for WorkflowStateStore interface.
 *
 * Wraps a Durable Object's storage API to implement the portable
 * WorkflowStateStore contract.
 */
import type { WorkflowStateStore } from "../interfaces.js";
/**
 * Minimal subset of DO storage we depend on. Avoids importing
 * @cloudflare/workers-types into the interface layer.
 */
interface DOStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
}
export declare class CloudflareWorkflowStateStore implements WorkflowStateStore {
  private readonly storage;
  constructor(storage: DOStorage);
  getRun(runId: string): Promise<unknown | null>;
  putRun(runId: string, state: unknown): Promise<void>;
}
export {};
//# sourceMappingURL=workflow-state-store.d.ts.map
