import type { AuditRepository, AuditEntry } from "../interfaces.js";

export class InMemoryAuditRepository implements AuditRepository {
  readonly entries: AuditEntry[] = [];

  async append(entry: AuditEntry): Promise<void> {
    this.entries.push({ ...entry });
  }

  async list(
    tenantId: string,
    opts?: { limit?: number; startAfter?: string },
  ): Promise<AuditEntry[]> {
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

  clear(): void {
    this.entries.length = 0;
  }
}
