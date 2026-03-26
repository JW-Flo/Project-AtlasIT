import type {
  WorkflowRepository,
  WorkflowExecution,
  WorkflowStep,
} from "../interfaces.js";
export declare class InMemoryWorkflowRepository implements WorkflowRepository {
  readonly executions: Map<string, WorkflowExecution>;
  recordExecution(
    execution: Omit<WorkflowExecution, "steps">,
    steps: WorkflowStep[],
  ): Promise<void>;
  findById(tenantId: string, id: string): Promise<WorkflowExecution | null>;
  findByIdempotencyKey(
    tenantId: string,
    key: string,
  ): Promise<WorkflowExecution | null>;
  countSince(tenantId: string, sinceIso: string): Promise<number>;
  clear(): void;
}
//# sourceMappingURL=in-memory-workflow-repository.d.ts.map
