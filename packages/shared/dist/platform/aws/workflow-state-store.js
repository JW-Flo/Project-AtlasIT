import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
export class DynamoWorkflowStateStore {
  doc;
  table;
  constructor(doc, table) {
    this.doc = doc;
    this.table = table;
  }
  async getRun(runId) {
    const result = await this.doc.send(
      new GetCommand({
        TableName: this.table,
        Key: { pk: "WORKFLOW_RUN", sk: runId },
      }),
    );
    return result.Item?.state ?? null;
  }
  async putRun(runId, state) {
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
//# sourceMappingURL=workflow-state-store.js.map
