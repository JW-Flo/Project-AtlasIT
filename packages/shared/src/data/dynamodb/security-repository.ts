import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  SecurityRepository,
  Incident,
  AccessRequest,
} from "../interfaces.js";

export class DynamoSecurityRepository implements SecurityRepository {
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async createIncident(incident: Incident): Promise<void> {
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

  async getIncident(tenantId: string, id: string): Promise<Incident | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `INCIDENT#${id}` },
      }),
    );
    if (!result.Item) return null;
    return this.toIncident(result.Item);
  }

  async listIncidents(
    tenantId: string,
    opts?: { status?: string; limit?: number },
  ): Promise<Incident[]> {
    const values: Record<string, unknown> = {
      ":pk": `TENANT#${tenantId}`,
      ":prefix": "INCIDENT#",
    };
    const names: Record<string, string> = {};
    let filterExpression: string | undefined;

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

  async updateIncident(
    tenantId: string,
    id: string,
    updates: Partial<Incident>,
  ): Promise<void> {
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

  async createAccessRequest(request: AccessRequest): Promise<void> {
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

  async getAccessRequest(
    tenantId: string,
    id: string,
  ): Promise<AccessRequest | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TENANT#${tenantId}`, sk: `ACCESS_REQ#${id}` },
      }),
    );
    if (!result.Item) return null;
    return this.toAccessRequest(result.Item);
  }

  async listAccessRequests(
    tenantId: string,
    opts?: { status?: string; limit?: number },
  ): Promise<AccessRequest[]> {
    const values: Record<string, unknown> = {
      ":pk": `TENANT#${tenantId}`,
      ":prefix": "ACCESS_REQ#",
    };
    const names: Record<string, string> = {};
    let filterExpression: string | undefined;

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

  async updateAccessRequest(
    tenantId: string,
    id: string,
    updates: Partial<AccessRequest>,
  ): Promise<void> {
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

  private toIncident(item: Record<string, unknown>): Incident {
    return {
      id: item.id as string,
      tenantId: item.tenantId as string,
      title: item.title as string,
      severity: item.severity as Incident["severity"],
      status: item.status as Incident["status"],
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
      resolvedAt: item.resolvedAt as string | null | undefined,
      description: item.description as string | undefined,
    };
  }

  private toAccessRequest(item: Record<string, unknown>): AccessRequest {
    return {
      id: item.id as string,
      tenantId: item.tenantId as string,
      requesterId: item.requesterId as string,
      resourceType: item.resourceType as string,
      resourceId: item.resourceId as string,
      justification: item.justification as string,
      status: item.status as AccessRequest["status"],
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
      decidedAt: item.decidedAt as string | null | undefined,
      decidedBy: item.decidedBy as string | null | undefined,
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

function buildUpdateExpression(updates: Record<string, unknown>): {
  expressions: string[];
  names: Record<string, string>;
  values: Record<string, unknown>;
} {
  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

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
