import { CdtEvent } from "../models.js";

// ISO 27001 A.16.1.1 – responsibilities and procedures for incident management
export function evalISO_A16_1_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const irpDocumented = (ev.payload as any)?.incident_mgmt_procedure_documented === true;
  return irpDocumented
    ? {
        decision: "pass",
        rationale: ["Incident management responsibilities and procedures documented"],
        references: ["ISO27001:A.16.1.1"],
      }
    : {
        decision: "fail",
        rationale: ["Incident management procedures missing"],
        references: ["ISO27001:A.16.1.1"],
      };
}
