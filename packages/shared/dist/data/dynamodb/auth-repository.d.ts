import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { AuthRepository, TokenRecord, Session } from "../interfaces.js";
export declare class DynamoAuthRepository implements AuthRepository {
  private readonly docClient;
  private readonly tableName;
  constructor(docClient: DynamoDBDocumentClient, tableName: string);
  findToken(hash: string): Promise<TokenRecord | null>;
  storeToken(token: TokenRecord): Promise<void>;
  deleteToken(hash: string): Promise<void>;
  getSession(id: string): Promise<Session | null>;
  putSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
}
//# sourceMappingURL=auth-repository.d.ts.map
