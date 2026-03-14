/**
 * Cloudflare DO storage adapter for WorkflowStateStore interface.
 *
 * Wraps a Durable Object's storage API to implement the portable
 * WorkflowStateStore contract.
 */
export class CloudflareWorkflowStateStore {
  storage;
  constructor(storage) {
    this.storage = storage;
  }
  async getRun(runId) {
    const state = await this.storage.get(`run:${runId}`);
    return state ?? null;
  }
  async putRun(runId, state) {
    await this.storage.put(`run:${runId}`, state);
  }
}
//# sourceMappingURL=workflow-state-store.js.map
