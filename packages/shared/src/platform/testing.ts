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

// ---------------------------------------------------------------------------
// InMemoryQueueBus
// ---------------------------------------------------------------------------

export interface PublishedMessage {
  queue: string;
  msg: unknown;
  opts?: PublishOptions;
  publishedAt: string;
}

export class InMemoryQueueBus implements QueueBus {
  readonly messages: PublishedMessage[] = [];

  async publish(
    queue: string,
    msg: unknown,
    opts?: PublishOptions,
  ): Promise<void> {
    this.messages.push({
      queue,
      msg,
      opts,
      publishedAt: new Date().toISOString(),
    });
  }

  /** Return messages published to a specific queue. */
  getMessages(queue: string): PublishedMessage[] {
    return this.messages.filter((m) => m.queue === queue);
  }

  clear(): void {
    this.messages.length = 0;
  }
}

// ---------------------------------------------------------------------------
// InMemoryWorkflowStateStore
// ---------------------------------------------------------------------------

export class InMemoryWorkflowStateStore implements WorkflowStateStore {
  private readonly store = new Map<string, unknown>();

  async getRun(runId: string): Promise<unknown | null> {
    return this.store.get(runId) ?? null;
  }

  async putRun(runId: string, state: unknown): Promise<void> {
    this.store.set(runId, structuredClone(state));
  }

  /** Diagnostic: return all stored run IDs. */
  getAllRunIds(): string[] {
    return Array.from(this.store.keys());
  }

  clear(): void {
    this.store.clear();
  }
}
