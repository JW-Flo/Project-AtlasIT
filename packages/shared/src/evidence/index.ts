export {
  classifyEvent,
  affectedFrameworks,
  detrimentalControls,
  bestClassification,
  type ClassifiedEvidence,
  type ControlClassification,
  type EvidenceImpact,
  type EvidenceCategory,
} from "./classifier.ts";

export {
  storeEvidence,
  queryEvidence,
  type EvidenceLockerItem,
  type LockerWriteResult,
  type LockerDependencies,
} from "./locker.ts";
