import { CdtEvent } from "../../models";

// GDPR Article 5(1)(f) – integrity and confidentiality
export function evalGDPR_Art5_1f(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const encryptionAtRest = (ev.payload as any)?.encryption_at_rest === true;
  const accessControlsEnforced = (ev.payload as any)?.access_controls_enforced === true;
  const bothControls = encryptionAtRest && accessControlsEnforced;
  return bothControls
    ? { decision: "pass", rationale: ["Encryption at rest and access controls protect data integrity"], references: ["GDPR:Art.5(1)(f)"] }
    : { decision: "fail", rationale: ["Missing encryption at rest or access controls for personal data"], references: ["GDPR:Art.5(1)(f)"] };
}
