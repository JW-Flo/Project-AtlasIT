import type {
  WorkflowRepository,
  WorkflowExecution,
  WorkflowStep,
} from "../interfaces.js";

export class InMemoryWorkflowRepository implements WorkflowRepository {
  readonly executions = new Map<string, WorkflowExecution>();

  async recordExecution(
    execution: Omit<WorkflowExecution, "steps">,
    steps: WorkflowStep[],
  ): Promise<void> {
    this.executions.set(execution.id, { ...execution, steps });
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<WorkflowExecution | null> {
    const exec = this.executions.get(id);
    if (exec && exec.tenantId === tenantId) return exec;
    return null;
  }

  async findByIdempotencyKey(
    tenantId: string,
    key: string,
  ): Promise<WorkflowExecution | null> {
    for (const exec of this.executions.values()) {
      if (exec.tenantId === tenantId && exec.idempotencyKey === key) {
        return exec;
      }
    }
    return null;
  }

  async countSince(tenantId: string, sinceIso: string): Promise<number> {
    let count = 0;
    for (const exec of this.executions.values()) {
      if (exec.tenantId === tenantId && exec.createdAt >= sinceIso) {
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.executions.clear();
  }
}
