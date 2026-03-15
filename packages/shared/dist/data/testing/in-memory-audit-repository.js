export class InMemoryAuditRepository {
  entries = [];
  async append(entry) {
    this.entries.push({ ...entry });
  }
  async list(tenantId, opts) {
    let results = this.entries.filter((e) => e.tenantId === tenantId);
    if (opts?.startAfter) {
      const idx = results.findIndex((e) => e.id === opts.startAfter);
      if (idx >= 0) {
        results = results.slice(idx + 1);
      }
    }
    if (opts?.limit) {
      results = results.slice(0, opts.limit);
    }
    return results;
  }
  clear() {
    this.entries.length = 0;
  }
}
//# sourceMappingURL=in-memory-audit-repository.js.map
