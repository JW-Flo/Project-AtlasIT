import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type {
  SecurityRepository,
  Incident,
  AccessRequest,
} from "../interfaces.js";
export declare class DynamoSecurityRepository implements SecurityRepository {
  private readonly docClient;
  private readonly tableName;
  constructor(docClient: DynamoDBDocumentClient, tableName: string);
  createIncident(incident: Incident): Promise<void>;
  getIncident(tenantId: string, id: string): Promise<Incident | null>;
  listIncidents(
    tenantId: string,
    opts?: {
      status?: string;
      limit?: number;
    },
  ): Promise<Incident[]>;
  updateIncident(
    tenantId: string,
    id: string,
    updates: Partial<Incident>,
  ): Promise<void>;
  createAccessRequest(request: AccessRequest): Promise<void>;
  getAccessRequest(tenantId: string, id: string): Promise<AccessRequest | null>;
  listAccessRequests(
    tenantId: string,
    opts?: {
      status?: string;
      limit?: number;
    },
  ): Promise<AccessRequest[]>;
  updateAccessRequest(
    tenantId: string,
    id: string,
    updates: Partial<AccessRequest>,
  ): Promise<void>;
  private toIncident;
  private toAccessRequest;
}
//# sourceMappingURL=security-repository.d.ts.map
