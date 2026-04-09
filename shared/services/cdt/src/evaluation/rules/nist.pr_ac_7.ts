import { CdtEvent } from "../../models";

// NIST CSF PR.AC-7 – users, devices, and other assets are authenticated
export function evalNIST_PR_AC_7(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const mfaRequired = (ev.payload as any)?.mfa_required === true;
  const mfaRequiredForPhi = (ev.payload as any)?.mfa_required_for_phi === true;
  if (mfaRequired || mfaRequiredForPhi) {
    return {
      decision: "pass",
      rationale: ["Multi-factor authentication enforced for user authentication"],
      references: ["NIST-CSF:PR.AC-7"],
    };
  }
  return {
    decision: "fail",
    rationale: ["MFA not required — authentication strength insufficient"],
    references: ["NIST-CSF:PR.AC-7"],
  };
}
