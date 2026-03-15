export class InMemoryPolicyRepository {
  templates = new Map();
  generated = new Map();
  evaluations = [];
  /** Map<controlKey, links[]> */
  controlEvidence = new Map();
  async listTemplates() {
    return [...this.templates.values()];
  }
  async getTemplate(key) {
    return this.templates.get(key) ?? null;
  }
  async findGeneratedByContext(tenantId, templateKey, contextHash) {
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
  async saveGenerated(policy, _inputCanonical) {
    this.generated.set(policy.hash, policy);
  }
  async recordEvaluation(data) {
    this.evaluations.push({
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      policyKey: data.policyKey,
      inputHash: data.inputHash,
      resultHash: data.resultHash,
      result: JSON.parse(data.resultJson),
      createdAt: new Date().toISOString(),
    });
  }
  async upsertControlEvidenceLink(controlKey, evidenceHash, tenantId) {
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
  async getCoverage(framework, tenantId) {
    const controls = [];
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
  clear() {
    this.templates.clear();
    this.generated.clear();
    this.evaluations.length = 0;
    this.controlEvidence.clear();
  }
}
//# sourceMappingURL=in-memory-policy-repository.js.map
