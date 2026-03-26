import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type { WorkflowStateStore } from "../interfaces.js";

export class DynamoWorkflowStateStore implements WorkflowStateStore {
  constructor(
    private readonly doc: DynamoDBDocumentClient,
    private readonly table: string,
  ) {}

  async getRun(runId: string): Promise<unknown | null> {
    const result = await this.doc.send(
      new GetCommand({
        TableName: this.table,
        Key: { pk: "WORKFLOW_RUN", sk: runId },
      }),
    );
    return result.Item?.state ?? null;
  }

  async putRun(runId: string, state: unknown): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          pk: "WORKFLOW_RUN",
          sk: runId,
          state,
          updatedAt: new Date().toISOString(),
        },
      }),
    );
  }
}
