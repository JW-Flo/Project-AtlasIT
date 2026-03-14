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

export class CloudflareWorkflowStateStore implements WorkflowStateStore {
  private readonly storage: DOStorage;

  constructor(storage: DOStorage) {
    this.storage = storage;
  }

  async getRun(runId: string): Promise<unknown | null> {
    const state = await this.storage.get(`run:${runId}`);
    return state ?? null;
  }

  async putRun(runId: string, state: unknown): Promise<void> {
    await this.storage.put(`run:${runId}`, state);
  }
}
