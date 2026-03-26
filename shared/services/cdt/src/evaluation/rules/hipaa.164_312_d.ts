import { CdtEvent } from "../../models";

// HIPAA 164.312(d) – person or entity authentication for PHI access
export function evalHIPAA_164_312_d(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const mfaRequired = (ev.payload as any)?.mfa_required_for_phi === true;
  return mfaRequired
    ? { decision: "pass", rationale: ["MFA required for all PHI system access"], references: ["HIPAA:164.312(d)"] }
    : { decision: "fail", rationale: ["MFA not required for PHI access — authentication weakness"], references: ["HIPAA:164.312(d)"] };
}
