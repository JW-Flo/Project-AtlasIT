import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { WorkflowStateStore } from "../interfaces.js";
export declare class DynamoWorkflowStateStore implements WorkflowStateStore {
  private readonly doc;
  private readonly table;
  constructor(doc: DynamoDBDocumentClient, table: string);
  getRun(runId: string): Promise<unknown | null>;
  putRun(runId: string, state: unknown): Promise<void>;
}
//# sourceMappingURL=workflow-state-store.d.ts.map
