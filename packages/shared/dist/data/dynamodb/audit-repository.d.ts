import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { AuditRepository, AuditEntry } from "../interfaces.js";
export declare class DynamoAuditRepository implements AuditRepository {
  private readonly docClient;
  private readonly tableName;
  constructor(docClient: DynamoDBDocumentClient, tableName: string);
  append(entry: AuditEntry): Promise<void>;
  list(
    tenantId: string,
    opts?: {
      limit?: number;
      startAfter?: string;
    },
  ): Promise<AuditEntry[]>;
}
//# sourceMappingURL=audit-repository.d.ts.map
