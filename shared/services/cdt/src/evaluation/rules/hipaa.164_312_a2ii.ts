import { CdtEvent } from "../../models";

// HIPAA 164.312(a)(2)(ii) – automatic logoff from PHI systems
export function evalHIPAA_164_312_a2ii(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const autoLogoffMins = (ev.payload as any)?.auto_logoff_mins ?? 9999;
  return autoLogoffMins <= 15
    ? { decision: "pass", rationale: [`Automatic logoff configured at ${autoLogoffMins} minutes`], references: ["HIPAA:164.312(a)(2)(ii)"] }
    : { decision: "fail", rationale: [`Auto logoff ${autoLogoffMins} minutes exceeds 15-minute threshold`], references: ["HIPAA:164.312(a)(2)(ii)"] };
}
