import { CdtEvent } from "../models.js";

export function evalSOC2_CC6_2(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const refs = ["SOC2-CC6.2"];
  const rationale: string[] = [];
  const mfa = (ev.payload as any)?.mfa_required === true;
  if (mfa) {
    rationale.push("IdP MFA policy required for all users");
    return { decision: "pass", rationale, references: refs };
  }
  rationale.push("MFA policy not enforced");
  return { decision: "fail", rationale, references: refs };
}
