/**
 * DynamoDB-backed cache repo — replaces KV_CACHE.
 * Key schema: pk = "cache#<key>"
 */

import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export class DynamoCacheRepo {
  constructor(
    private readonly ddb: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const result = await this.ddb.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `cache#${key}` },
      }),
    );
    if (!result.Item) return null;
    if (result.Item.ttl && result.Item.ttl < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return JSON.parse(result.Item.value as string) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    await this.ddb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `cache#${key}`,
          value: JSON.stringify(value),
          ttl: Math.floor(Date.now() / 1000) + ttlSeconds,
        },
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.ddb.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `cache#${key}` },
      }),
    );
  }
}
