/**
 * DynamoDB-backed feature flag repo — replaces KV_FEATURE_FLAGS.
 * Key schema: pk = "flag#<flagName>"
 */

import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCommand, PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPct: number;
  tenantOverrides: Record<string, boolean>;
}

export class DynamoFlagRepo {
  constructor(
    private readonly ddb: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async get(flagName: string): Promise<FeatureFlag | null> {
    const result = await this.ddb.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `flag#${flagName}` },
      }),
    );
    if (!result.Item) return null;
    return {
      name: flagName,
      enabled: result.Item.enabled as boolean,
      rolloutPct: (result.Item.rolloutPct as number) ?? 100,
      tenantOverrides: (result.Item.tenantOverrides as Record<string, boolean>) ?? {},
    };
  }

  async isEnabled(flagName: string, tenantId?: string): Promise<boolean> {
    const flag = await this.get(flagName);
    if (!flag) return false;
    if (tenantId && tenantId in flag.tenantOverrides) {
      return flag.tenantOverrides[tenantId];
    }
    if (!flag.enabled) return false;
    if (flag.rolloutPct >= 100) return true;
    // Deterministic hash-based rollout
    const hash = simpleHash(`${flagName}:${tenantId ?? "global"}`);
    return (hash % 100) < flag.rolloutPct;
  }

  async set(flag: FeatureFlag): Promise<void> {
    await this.ddb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `flag#${flag.name}`,
          ...flag,
        },
      }),
    );
  }

  async listAll(): Promise<FeatureFlag[]> {
    const result = await this.ddb.send(
      new ScanCommand({ TableName: this.tableName }),
    );
    return (result.Items ?? []).map((item) => ({
      name: (item.pk as string).replace("flag#", ""),
      enabled: item.enabled as boolean,
      rolloutPct: (item.rolloutPct as number) ?? 100,
      tenantOverrides: (item.tenantOverrides as Record<string, boolean>) ?? {},
    }));
  }

  async delete(flagName: string): Promise<void> {
    await this.ddb.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `flag#${flagName}` },
      }),
    );
  }
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
