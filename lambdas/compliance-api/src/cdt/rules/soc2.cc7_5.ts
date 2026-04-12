import { CdtEvent } from "../models.js";

// SOC2 CC7.5 – identified incidents are disclosed to affected parties
export function evalSOC2_CC7_5(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const disclosureProcedureExists =
    (ev.payload as any)?.breach_disclosure_procedure_exists === true;
  return disclosureProcedureExists
    ? {
        decision: "pass",
        rationale: ["Breach disclosure procedure documented and current"],
        references: ["SOC2-CC7.5"],
      }
    : {
        decision: "fail",
        rationale: ["Breach disclosure procedure missing or outdated"],
        references: ["SOC2-CC7.5"],
      };
}
