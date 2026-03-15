import type { AuditRepository, AuditEntry } from "../interfaces.js";
export declare class InMemoryAuditRepository implements AuditRepository {
  readonly entries: AuditEntry[];
  append(entry: AuditEntry): Promise<void>;
  list(
    tenantId: string,
    opts?: {
      limit?: number;
      startAfter?: string;
    },
  ): Promise<AuditEntry[]>;
  clear(): void;
}
//# sourceMappingURL=in-memory-audit-repository.d.ts.map
