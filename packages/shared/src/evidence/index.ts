export {
  classifyEvent,
  affectedFrameworks,
  detrimentalControls,
  bestClassification,
  type ClassifiedEvidence,
  type ControlClassification,
  type EvidenceImpact,
  type EvidenceCategory,
} from "./classifier";

export {
  storeEvidence,
  queryEvidence,
  type EvidenceLockerItem,
  type LockerWriteResult,
  type LockerDependencies,
} from "./locker";

export {
  collectAdapterEvidence,
  collectAllAdapterEvidence,
  ADAPTER_EVIDENCE_REGISTRY,
  type AdapterEvidenceConfig,
  type AdapterEvidenceType,
  type AdapterEvidenceResult,
  type AdapterEvidenceItem,
  parseControlRef,
} from "./adapter-collector";

export {
  lookupAuditEvidence,
  AUDIT_EVIDENCE_REGISTRY,
  PLATFORM_STATE_PROBES,
  type AuditEvidenceMapping,
  type PlatformStateProbe,
} from "./platform-evidence";

export { collectPlatformStateEvidence, type StateEvidenceResult } from "./platform-state-collector";

export {
  isEvidenceDeletionAllowed,
  enforceRetentionPolicy,
  type RetentionResult,
} from "./retention";

export { buildCdtPayloadFromEvidence, flattenAdapterResults } from "./cdt-field-mapper";

export { computeAuditMetrics, type ComputedMetrics } from "./computed-metrics";
