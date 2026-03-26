import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
export class DynamoWorkflowRepository {
  docClient;
  tableName;
  constructor(docClient, tableName) {
    this.docClient = docClient;
    this.tableName = tableName;
  }
  async recordExecution(execution, steps) {
    const item = {
      pk: `TENANT#${execution.tenantId}`,
      sk: `EXEC#${execution.id}`,
      ...execution,
      steps,
    };
    if (execution.idempotencyKey) {
      item.gsi1pk = `TENANT#${execution.tenantId}`;
      item.gsi1sk = `IDEM#${execution.idempotencyKey}`;
    }
    await this.docClient.send(
      new PutCommand({ TableName: this.tableName, Item: item }),
    );
  }
  async findById(tenantId, id) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `EXEC#${id}` },
      }),
    );
    if (!result.Item) return null;
    return this.toExecution(result.Item);
  }
  async findByIdempotencyKey(tenantId, key) {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk AND gsi1sk = :sk",
        ExpressionAttributeValues: {
          ":pk": `TENANT#${tenantId}`,
          ":sk": `IDEM#${key}`,
        },
        Limit: 1,
      }),
    );
    const item = result.Items?.[0];
    if (!item) return null;
    return this.toExecution(item);
  }
  async countSince(tenantId, sinceIso) {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        FilterExpression: "createdAt >= :since",
        ExpressionAttributeValues: {
          ":pk": `TENANT#${tenantId}`,
          ":prefix": "EXEC#",
          ":since": sinceIso,
        },
        Select: "COUNT",
      }),
    );
    return result.Count ?? 0;
  }
  toExecution(item) {
    return {
      id: item.id,
      tenantId: item.tenantId,
      workflowType: item.workflowType,
      subjectRef: item.subjectRef ?? null,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      completedAt: item.completedAt ?? null,
      durationMs: item.durationMs,
      idempotencyKey: item.idempotencyKey ?? null,
      context: item.context ?? {},
      steps: item.steps ?? [],
    };
  }
}
//# sourceMappingURL=workflow-repository.js.map
