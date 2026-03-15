import type {
  PolicyRepository,
  PolicyTemplate,
  GeneratedPolicy,
  PolicyEvaluation,
  CoverageSummary,
} from "../interfaces.js";
export declare class InMemoryPolicyRepository implements PolicyRepository {
  readonly templates: Map<string, PolicyTemplate>;
  readonly generated: Map<string, GeneratedPolicy>;
  readonly evaluations: PolicyEvaluation[];
  /** Map<controlKey, links[]> */
  readonly controlEvidence: Map<
    string,
    {
      hash: string;
      tenantId: string;
      createdAt: string;
    }[]
  >;
  listTemplates(): Promise<PolicyTemplate[]>;
  getTemplate(key: string): Promise<PolicyTemplate | null>;
  findGeneratedByContext(
    tenantId: string,
    templateKey: string,
    contextHash: string,
  ): Promise<GeneratedPolicy | null>;
  saveGenerated(
    policy: GeneratedPolicy,
    _inputCanonical: string,
  ): Promise<void>;
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
  clear(): void;
}
//# sourceMappingURL=in-memory-policy-repository.d.ts.map
