export class InMemoryWorkflowRepository {
  executions = new Map();
  async recordExecution(execution, steps) {
    this.executions.set(execution.id, { ...execution, steps });
  }
  async findById(tenantId, id) {
    const exec = this.executions.get(id);
    if (exec && exec.tenantId === tenantId) return exec;
    return null;
  }
  async findByIdempotencyKey(tenantId, key) {
    for (const exec of this.executions.values()) {
      if (exec.tenantId === tenantId && exec.idempotencyKey === key) {
        return exec;
      }
    }
    return null;
  }
  async countSince(tenantId, sinceIso) {
    let count = 0;
    for (const exec of this.executions.values()) {
      if (exec.tenantId === tenantId && exec.createdAt >= sinceIso) {
        count++;
      }
    }
    return count;
  }
  clear() {
    this.executions.clear();
  }
}
//# sourceMappingURL=in-memory-workflow-repository.js.map
