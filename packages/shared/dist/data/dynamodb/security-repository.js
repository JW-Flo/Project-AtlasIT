import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
export class DynamoSecurityRepository {
  docClient;
  tableName;
  constructor(docClient, tableName) {
    this.docClient = docClient;
    this.tableName = tableName;
  }
  async createIncident(incident) {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `TENANT#${incident.tenantId}`,
          sk: `INCIDENT#${incident.id}`,
          ...incident,
        },
      }),
    );
  }
  async getIncident(tenantId, id) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `INCIDENT#${id}` },
      }),
    );
    if (!result.Item) return null;
    return this.toIncident(result.Item);
  }
  async listIncidents(tenantId, opts) {
    const values = {
      ":pk": `TENANT#${tenantId}`,
      ":prefix": "INCIDENT#",
    };
    const names = {};
    let filterExpression;
    if (opts?.status) {
      filterExpression = "#s = :status";
      names["#s"] = "status";
      values[":status"] = opts.status;
    }
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: values,
        ...(Object.keys(names).length > 0 && {
          ExpressionAttributeNames: names,
        }),
        ...(filterExpression && { FilterExpression: filterExpression }),
        ...(opts?.limit && { Limit: opts.limit }),
      }),
    );
    return (result.Items ?? []).map(this.toIncident);
  }
  async updateIncident(tenantId, id, updates) {
    const { expressions, names, values } = buildUpdateExpression(updates);
    if (!expressions.length) return;
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `INCIDENT#${id}` },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
  }
  async createAccessRequest(request) {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `TENANT#${request.tenantId}`,
          sk: `ACCESS_REQ#${request.id}`,
          ...request,
        },
      }),
    );
  }
  async getAccessRequest(tenantId, id) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `ACCESS_REQ#${id}` },
      }),
    );
    if (!result.Item) return null;
    return this.toAccessRequest(result.Item);
  }
  async listAccessRequests(tenantId, opts) {
    const values = {
      ":pk": `TENANT#${tenantId}`,
      ":prefix": "ACCESS_REQ#",
    };
    const names = {};
    let filterExpression;
    if (opts?.status) {
      filterExpression = "#s = :status";
      names["#s"] = "status";
      values[":status"] = opts.status;
    }
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: values,
        ...(Object.keys(names).length > 0 && {
          ExpressionAttributeNames: names,
        }),
        ...(filterExpression && { FilterExpression: filterExpression }),
        ...(opts?.limit && { Limit: opts.limit }),
      }),
    );
    return (result.Items ?? []).map(this.toAccessRequest);
  }
  async updateAccessRequest(tenantId, id, updates) {
    const { expressions, names, values } = buildUpdateExpression(updates);
    if (!expressions.length) return;
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `ACCESS_REQ#${id}` },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
  }
  toIncident(item) {
    return {
      id: item.id,
      tenantId: item.tenantId,
      title: item.title,
      severity: item.severity,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      resolvedAt: item.resolvedAt,
      description: item.description,
    };
  }
  toAccessRequest(item) {
    return {
      id: item.id,
      tenantId: item.tenantId,
      requesterId: item.requesterId,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      justification: item.justification,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      decidedAt: item.decidedAt,
      decidedBy: item.decidedBy,
    };
  }
}
const RESERVED_WORDS = new Set([
  "status",
  "action",
  "resource",
  "description",
  "name",
  "type",
]);
function buildUpdateExpression(updates) {
  const expressions = [];
  const names = {};
  const values = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === "id" || key === "tenantId" || value === undefined) continue;
    const needsAlias = RESERVED_WORDS.has(key);
    const attrRef = needsAlias ? `#${key}` : key;
    const valRef = `:${key}`;
    if (needsAlias) {
      names[`#${key}`] = key;
    }
    expressions.push(`${attrRef} = ${valRef}`);
    values[valRef] = value;
  }
  return { expressions, names, values };
}
//# sourceMappingURL=security-repository.js.map
