import type {
  SecurityRepository,
  Incident,
  AccessRequest,
} from "../interfaces.js";

export class InMemorySecurityRepository implements SecurityRepository {
  readonly incidents = new Map<string, Incident>();
  readonly accessRequests = new Map<string, AccessRequest>();

  async createIncident(incident: Incident): Promise<void> {
    this.incidents.set(incident.id, { ...incident });
  }

  async getIncident(tenantId: string, id: string): Promise<Incident | null> {
    const incident = this.incidents.get(id);
    if (incident && incident.tenantId === tenantId) return incident;
    return null;
  }

  async listIncidents(
    tenantId: string,
    opts?: { status?: string; limit?: number },
  ): Promise<Incident[]> {
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

  async updateIncident(
    tenantId: string,
    id: string,
    updates: Partial<Incident>,
  ): Promise<void> {
    const incident = this.incidents.get(id);
    if (incident && incident.tenantId === tenantId) {
      this.incidents.set(id, { ...incident, ...updates, id, tenantId });
    }
  }

  async createAccessRequest(request: AccessRequest): Promise<void> {
    this.accessRequests.set(request.id, { ...request });
  }

  async getAccessRequest(
    tenantId: string,
    id: string,
  ): Promise<AccessRequest | null> {
    const request = this.accessRequests.get(id);
    if (request && request.tenantId === tenantId) return request;
    return null;
  }

  async listAccessRequests(
    tenantId: string,
    opts?: { status?: string; limit?: number },
  ): Promise<AccessRequest[]> {
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

  async updateAccessRequest(
    tenantId: string,
    id: string,
    updates: Partial<AccessRequest>,
  ): Promise<void> {
    const request = this.accessRequests.get(id);
    if (request && request.tenantId === tenantId) {
      this.accessRequests.set(id, { ...request, ...updates, id, tenantId });
    }
  }

  clear(): void {
    this.incidents.clear();
    this.accessRequests.clear();
  }
}
