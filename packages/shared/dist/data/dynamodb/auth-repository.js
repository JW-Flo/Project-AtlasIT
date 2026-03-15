import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
export class DynamoAuthRepository {
  docClient;
  tableName;
  constructor(docClient, tableName) {
    this.docClient = docClient;
    this.tableName = tableName;
  }
  async findToken(hash) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `TOKEN#${hash}`, sk: `TOKEN#${hash}` },
      }),
    );
    if (!result.Item) return null;
    return {
      hash: result.Item.hash,
      tenantId: result.Item.tenantId,
      roles: result.Item.roles,
      algorithm: result.Item.algorithm,
      salt: result.Item.salt,
      createdAt: result.Item.createdAt,
    };
  }
  async storeToken(token) {
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
  async deleteToken(hash) {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `TOKEN#${hash}`, sk: `TOKEN#${hash}` },
      }),
    );
  }
  async getSession(id) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `SESSION#${id}`, sk: `SESSION#${id}` },
      }),
    );
    if (!result.Item) return null;
    return {
      id: result.Item.id,
      tenantId: result.Item.tenantId,
      userId: result.Item.userId,
      createdAt: result.Item.createdAt,
      expiresAt: result.Item.expiresAt,
    };
  }
  async putSession(session) {
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
  async deleteSession(id) {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `SESSION#${id}`, sk: `SESSION#${id}` },
      }),
    );
  }
}
//# sourceMappingURL=auth-repository.js.map
