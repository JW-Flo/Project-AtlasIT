/**
 * DynamoDB-backed session repo — replaces KV_SESSIONS.
 * Key schema: pk = "session#<sessionId>"
 */

import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export interface Session {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  expiresAt: number;
  [key: string]: unknown;
}

export class DynamoSessionRepo {
  constructor(
    private readonly ddb: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async get(sessionId: string): Promise<Session | null> {
    const result = await this.ddb.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `session#${sessionId}` },
      }),
    );
    if (!result.Item) return null;
    const { pk, ttl, ...session } = result.Item;
    if (ttl && ttl < Math.floor(Date.now() / 1000)) return null;
    return session as Session;
  }

  async set(sessionId: string, session: Session, ttlSeconds = 86400): Promise<void> {
    await this.ddb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `session#${sessionId}`,
          ...session,
          ttl: Math.floor(Date.now() / 1000) + ttlSeconds,
        },
      }),
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.ddb.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `session#${sessionId}` },
      }),
    );
  }
}
