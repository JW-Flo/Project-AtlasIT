import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type {
  WorkflowRepository,
  WorkflowExecution,
  WorkflowStep,
} from "../interfaces.js";
export declare class DynamoWorkflowRepository implements WorkflowRepository {
  private readonly docClient;
  private readonly tableName;
  constructor(docClient: DynamoDBDocumentClient, tableName: string);
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
  private toExecution;
}
//# sourceMappingURL=workflow-repository.d.ts.map
