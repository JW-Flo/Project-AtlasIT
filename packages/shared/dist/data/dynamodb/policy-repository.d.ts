import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type {
  PolicyRepository,
  PolicyTemplate,
  GeneratedPolicy,
  CoverageSummary,
} from "../interfaces.js";
export declare class DynamoPolicyRepository implements PolicyRepository {
  private readonly docClient;
  private readonly tableName;
  constructor(docClient: DynamoDBDocumentClient, tableName: string);
  listTemplates(): Promise<PolicyTemplate[]>;
  getTemplate(key: string): Promise<PolicyTemplate | null>;
  findGeneratedByContext(
    tenantId: string,
    templateKey: string,
    contextHash: string,
  ): Promise<GeneratedPolicy | null>;
  saveGenerated(policy: GeneratedPolicy, inputCanonical: string): Promise<void>;
  recordEvaluation(data: {
    tenantId: string;
    policyKey: string;
    inputHash: string;
    resultHash: string;
    resultJson: string;
  }): Promise<void>;
  upsertControlEvidenceLink(
    controlKey: string,
    evidenceHash: string,
    tenantId: string,
  ): Promise<{
    created: boolean;
    createdAt: string;
  }>;
  getCoverage(framework: string, tenantId: string): Promise<CoverageSummary>;
}
//# sourceMappingURL=policy-repository.d.ts.map
