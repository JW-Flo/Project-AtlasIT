import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type { AuthRepository, TokenRecord, Session } from "../interfaces.js";

export class DynamoAuthRepository implements AuthRepository {
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async findToken(hash: string): Promise<TokenRecord | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TOKEN#${hash}`, sk: `TOKEN#${hash}` },
      }),
    );
    if (!result.Item) return null;
    return {
      hash: result.Item.hash as string,
      tenantId: result.Item.tenantId as string,
      roles: result.Item.roles as string[],
      algorithm: result.Item.algorithm as string,
      salt: result.Item.salt as string,
      createdAt: result.Item.createdAt as string,
    };
  }

  async storeToken(token: TokenRecord): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `TOKEN#${token.hash}`,
          sk: `TOKEN#${token.hash}`,
          ...token,
        },
      }),
    );
  }

  async deleteToken(hash: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `TOKEN#${hash}`, sk: `TOKEN#${hash}` },
      }),
    );
  }

  async getSession(id: string): Promise<Session | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `SESSION#${id}`, sk: `SESSION#${id}` },
      }),
    );
    if (!result.Item) return null;
    return {
      id: result.Item.id as string,
      tenantId: result.Item.tenantId as string,
      userId: result.Item.userId as string,
      createdAt: result.Item.createdAt as string,
      expiresAt: result.Item.expiresAt as string,
    };
  }

  async putSession(session: Session): Promise<void> {
    const ttl = Math.floor(new Date(session.expiresAt).getTime() / 1000);
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `SESSION#${session.id}`,
          sk: `SESSION#${session.id}`,
          ...session,
          ttl,
        },
      }),
    );
  }

  async deleteSession(id: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `SESSION#${id}`, sk: `SESSION#${id}` },
      }),
    );
  }
}
