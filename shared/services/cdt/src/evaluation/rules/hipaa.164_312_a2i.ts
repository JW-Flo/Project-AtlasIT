import { CdtEvent } from "../../models";

// HIPAA 164.312(a)(2)(i) – emergency access procedure for PHI
export function evalHIPAA_164_312_a2i(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const emergencyAccessProcedureExists = (ev.payload as any)?.emergency_access_procedure_exists === true;
  return emergencyAccessProcedureExists
    ? { decision: "pass", rationale: ["Emergency access procedure for PHI documented"], references: ["HIPAA:164.312(a)(2)(i)"] }
    : { decision: "fail", rationale: ["Emergency access procedure for PHI not documented"], references: ["HIPAA:164.312(a)(2)(i)"] };
}
