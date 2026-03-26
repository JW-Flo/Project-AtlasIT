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

// ---------------------------------------------------------------------------
// InMemoryEvidenceStore
// ---------------------------------------------------------------------------

export interface StoredEvidence {
  tenantId: string;
  runId: string;
  stepId: string;
  hash: string;
  body: string;
}

export class InMemoryEvidenceStore implements EvidenceStore {
  private readonly store = new Map<string, StoredEvidence>();

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async put(
    tenantId: string,
    runId: string,
    stepId: string,
    hash: string,
    body: string,
  ): Promise<EvidenceWriteResult> {
    const key = `evidence/${tenantId}/${runId}/${stepId}/${hash}.json`;
    const alreadyExists = this.store.has(key);
    if (!alreadyExists) {
      this.store.set(key, { tenantId, runId, stepId, hash, body });
    }
    return { key, uri: `mem://${key}`, alreadyExists };
  }

  async get(key: string): Promise<EvidenceReadResult | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return { body: entry.body };
  }

  /** Return all stored evidence entries for inspection in tests. */
  getAll(): StoredEvidence[] {
    return Array.from(this.store.values());
  }

  /** Return evidence entries for a specific run. */
  getByRun(runId: string): StoredEvidence[] {
    return this.getAll().filter((e) => e.runId === runId);
  }

  clear(): void {
    this.store.clear();
  }
}
