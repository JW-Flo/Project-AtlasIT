import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  WorkflowRepository,
  WorkflowExecution,
  WorkflowStep,
} from "../interfaces.js";

export class DynamoWorkflowRepository implements WorkflowRepository {
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async recordExecution(
    execution: Omit<WorkflowExecution, "steps">,
    steps: WorkflowStep[],
  ): Promise<void> {
    const item: Record<string, unknown> = {
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

  async findById(
    tenantId: string,
    id: string,
  ): Promise<WorkflowExecution | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `EXEC#${id}` },
      }),
    );
    if (!result.Item) return null;
    return this.toExecution(result.Item);
  }

  async findByIdempotencyKey(
    tenantId: string,
    key: string,
  ): Promise<WorkflowExecution | null> {
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

  async countSince(tenantId: string, sinceIso: string): Promise<number> {
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

  private toExecution(item: Record<string, unknown>): WorkflowExecution {
    return {
      id: item.id as string,
      tenantId: item.tenantId as string,
      workflowType: item.workflowType as string,
      subjectRef: (item.subjectRef as string | null) ?? null,
      status: item.status as string,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
      completedAt: (item.completedAt as string | null) ?? null,
      durationMs: item.durationMs as number,
      idempotencyKey: (item.idempotencyKey as string | null) ?? null,
      context: (item.context as Record<string, unknown>) ?? {},
      steps: (item.steps as WorkflowStep[]) ?? [],
    };
  }
}
