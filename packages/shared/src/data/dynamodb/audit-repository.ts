import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { AuditRepository, AuditEntry } from "../interfaces.js";

export class DynamoAuditRepository implements AuditRepository {
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async append(entry: AuditEntry): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `AUDIT#${entry.tenantId}`,
          sk: `${entry.timestamp}#${entry.id}`,
          ...entry,
        },
      }),
    );
  }

  async list(
    tenantId: string,
    opts?: { limit?: number; startAfter?: string },
  ): Promise<AuditEntry[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": `AUDIT#${tenantId}`,
        },
        ScanIndexForward: false,
        ...(opts?.limit && { Limit: opts.limit }),
        ...(opts?.startAfter && {
          ExclusiveStartKey: {
            pk: `AUDIT#${tenantId}`,
            sk: opts.startAfter,
          },
        }),
      }),
    );
    return (result.Items ?? []).map((item) => ({
      id: item.id as string,
      tenantId: item.tenantId as string,
      action: item.action as string,
      actor: item.actor as string,
      resource: item.resource as string,
      timestamp: item.timestamp as string,
      metadata: item.metadata as Record<string, unknown> | undefined,
    }));
  }
}
