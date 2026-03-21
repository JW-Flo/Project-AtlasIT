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
