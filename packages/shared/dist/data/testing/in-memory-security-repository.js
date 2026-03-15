export class InMemorySecurityRepository {
  incidents = new Map();
  accessRequests = new Map();
  async createIncident(incident) {
    this.incidents.set(incident.id, { ...incident });
  }
  async getIncident(tenantId, id) {
    const incident = this.incidents.get(id);
    if (incident && incident.tenantId === tenantId) return incident;
    return null;
  }
  async listIncidents(tenantId, opts) {
    let results = [...this.incidents.values()].filter(
      (i) => i.tenantId === tenantId,
    );
    if (opts?.status) {
      results = results.filter((i) => i.status === opts.status);
    }
    if (opts?.limit) {
      results = results.slice(0, opts.limit);
    }
    return results;
  }
  async updateIncident(tenantId, id, updates) {
    const incident = this.incidents.get(id);
    if (incident && incident.tenantId === tenantId) {
      this.incidents.set(id, { ...incident, ...updates, id, tenantId });
    }
  }
  async createAccessRequest(request) {
    this.accessRequests.set(request.id, { ...request });
  }
  async getAccessRequest(tenantId, id) {
    const request = this.accessRequests.get(id);
    if (request && request.tenantId === tenantId) return request;
    return null;
  }
  async listAccessRequests(tenantId, opts) {
    let results = [...this.accessRequests.values()].filter(
      (r) => r.tenantId === tenantId,
    );
    if (opts?.status) {
      results = results.filter((r) => r.status === opts.status);
    }
    if (opts?.limit) {
      results = results.slice(0, opts.limit);
    }
    return results;
  }
  async updateAccessRequest(tenantId, id, updates) {
    const request = this.accessRequests.get(id);
    if (request && request.tenantId === tenantId) {
      this.accessRequests.set(id, { ...request, ...updates, id, tenantId });
    }
  }
  clear() {
    this.incidents.clear();
    this.accessRequests.clear();
  }
}
//# sourceMappingURL=in-memory-security-repository.js.map
