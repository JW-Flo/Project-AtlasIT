/**
 * In-memory implementations of platform interfaces for testing.
 *
 * These are NOT shipped to production bundles. They enable fast, isolated
 * unit tests without needing Cloudflare bindings.
 */
export class InMemoryQueueBus {
  messages = [];
  async publish(queue, msg, opts) {
    this.messages.push({
      queue,
      msg,
      opts,
      publishedAt: new Date().toISOString(),
    });
  }
  /** Return messages published to a specific queue. */
  getMessages(queue) {
    return this.messages.filter((m) => m.queue === queue);
  }
  clear() {
    this.messages.length = 0;
  }
}
// ---------------------------------------------------------------------------
// InMemoryWorkflowStateStore
// ---------------------------------------------------------------------------
export class InMemoryWorkflowStateStore {
  store = new Map();
  async getRun(runId) {
    return this.store.get(runId) ?? null;
  }
  async putRun(runId, state) {
    this.store.set(runId, structuredClone(state));
  }
  /** Diagnostic: return all stored run IDs. */
  getAllRunIds() {
    return Array.from(this.store.keys());
  }
  clear() {
    this.store.clear();
  }
}
export class InMemoryEvidenceStore {
  store = new Map();
  async exists(key) {
    return this.store.has(key);
  }
  async put(tenantId, runId, stepId, hash, body) {
    const key = `evidence/${tenantId}/${runId}/${stepId}/${hash}.json`;
    const alreadyExists = this.store.has(key);
    if (!alreadyExists) {
      this.store.set(key, { tenantId, runId, stepId, hash, body });
    }
    return { key, uri: `mem://${key}`, alreadyExists };
  }
  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    return { body: entry.body };
  }
  /** Return all stored evidence entries for inspection in tests. */
  getAll() {
    return Array.from(this.store.values());
  }
  /** Return evidence entries for a specific run. */
  getByRun(runId) {
    return this.getAll().filter((e) => e.runId === runId);
  }
  clear() {
    this.store.clear();
  }
}
//# sourceMappingURL=testing.js.map
