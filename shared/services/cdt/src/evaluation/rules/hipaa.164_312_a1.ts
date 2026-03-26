import { CdtEvent } from "../../models";

// HIPAA 164.312(a)(1) – access control: unique user identification for PHI systems
export function evalHIPAA_164_312_a1(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const uniqueIdEnforced = (ev.payload as any)?.unique_user_id_enforced === true;
  return uniqueIdEnforced
    ? { decision: "pass", rationale: ["Unique user identification enforced on all PHI systems"], references: ["HIPAA:164.312(a)(1)"] }
    : { decision: "fail", rationale: ["Unique user identification not enforced — shared credentials risk"], references: ["HIPAA:164.312(a)(1)"] };
}
