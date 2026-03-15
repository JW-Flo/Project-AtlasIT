import type {
  WorkflowRepository,
  PolicyRepository,
  SecurityRepository,
  AuditRepository,
  AuthRepository,
} from "../../data/interfaces.js";
import type { EvidenceStore, QueueBus, SecretResolver } from "../interfaces.js";
import { EvidenceEmitter } from "../../workflow/evidence-emitter.js";
export interface ServiceContainer {
  workflowRepo: WorkflowRepository;
  policyRepo: PolicyRepository;
  securityRepo: SecurityRepository;
  auditRepo: AuditRepository;
  authRepo: AuthRepository;
  evidenceStore: EvidenceStore;
  evidenceEmitter: EvidenceEmitter;
  queueBus: QueueBus;
  secretResolver: SecretResolver;
}
export declare function bootstrap(): ServiceContainer;
//# sourceMappingURL=bootstrap.d.ts.map
