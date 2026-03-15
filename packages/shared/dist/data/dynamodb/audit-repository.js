import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
export class DynamoAuditRepository {
  docClient;
  tableName;
  constructor(docClient, tableName) {
    this.docClient = docClient;
    this.tableName = tableName;
  }
  async append(entry) {
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
  async list(tenantId, opts) {
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
      id: item.id,
      tenantId: item.tenantId,
      action: item.action,
      actor: item.actor,
      resource: item.resource,
      timestamp: item.timestamp,
      metadata: item.metadata,
    }));
  }
}
//# sourceMappingURL=audit-repository.js.map
