import type {
  PolicyRepository,
  PolicyTemplate,
  GeneratedPolicy,
  PolicyEvaluation,
  CoverageSummary,
} from "../interfaces.js";

export class InMemoryPolicyRepository implements PolicyRepository {
  readonly templates = new Map<string, PolicyTemplate>();
  readonly generated = new Map<string, GeneratedPolicy>();
  readonly evaluations: PolicyEvaluation[] = [];
  /** Map<controlKey, links[]> */
  readonly controlEvidence = new Map<
    string,
    { hash: string; tenantId: string; createdAt: string }[]
  >();

  async listTemplates(): Promise<PolicyTemplate[]> {
    return [...this.templates.values()];
  }

  async getTemplate(key: string): Promise<PolicyTemplate | null> {
    return this.templates.get(key) ?? null;
  }

  async findGeneratedByContext(
    tenantId: string,
    templateKey: string,
    contextHash: string,
  ): Promise<GeneratedPolicy | null> {
    for (const policy of this.generated.values()) {
      if (
        policy.tenantId === tenantId &&
        policy.templateKey === templateKey &&
        policy.contextHash === contextHash
      ) {
        return policy;
      }
    }
    return null;
  }

  async saveGenerated(
    policy: GeneratedPolicy,
    _inputCanonical: string,
  ): Promise<void> {
    this.generated.set(policy.hash, policy);
  }

  async recordEvaluation(data: {
    tenantId: string;
    policyKey: string;
    inputHash: string;
    resultHash: string;
    resultJson: string;
  }): Promise<void> {
    this.evaluations.push({
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      policyKey: data.policyKey,
      inputHash: data.inputHash,
      resultHash: data.resultHash,
      result: JSON.parse(data.resultJson) as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    });
  }

  async upsertControlEvidenceLink(
    controlKey: string,
    evidenceHash: string,
    tenantId: string,
  ): Promise<{ created: boolean; createdAt: string }> {
    const links = this.controlEvidence.get(controlKey) ?? [];
    const existing = links.find(
      (l) => l.hash === evidenceHash && l.tenantId === tenantId,
    );
    if (existing) {
      return { created: false, createdAt: existing.createdAt };
    }
    const createdAt = new Date().toISOString();
    links.push({ hash: evidenceHash, tenantId, createdAt });
    this.controlEvidence.set(controlKey, links);
    return { created: true, createdAt };
  }

  async getCoverage(
    framework: string,
    tenantId: string,
  ): Promise<CoverageSummary> {
    const controls: {
      controlKey: string;
      title: string;
      evidenceCount: number;
    }[] = [];

    for (const [controlKey, links] of this.controlEvidence) {
      if (!controlKey.startsWith(framework)) continue;
      const tenantLinks = links.filter((l) => l.tenantId === tenantId);
      if (tenantLinks.length > 0) {
        controls.push({
          controlKey,
          title: controlKey,
          evidenceCount: tenantLinks.length,
        });
      }
    }

    const totalControls = Math.max(controls.length, 1);
    const coveredControls = controls.filter((c) => c.evidenceCount > 0).length;

    return {
      framework,
      totalControls,
      controls,
      coveragePercent: Math.round((coveredControls / totalControls) * 100),
    };
  }

  clear(): void {
    this.templates.clear();
    this.generated.clear();
    this.evaluations.length = 0;
    this.controlEvidence.clear();
  }
}
