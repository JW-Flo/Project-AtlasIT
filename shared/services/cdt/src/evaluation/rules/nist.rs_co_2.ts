import { CdtEvent } from "../../models";

// NIST CSF RS.CO-2 – incidents reported consistent with established criteria
export function evalNIST_RS_CO_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const incidentReportingTimely = (ev.payload as any)?.incident_reporting_sla_met === true;
  return incidentReportingTimely
    ? { decision: "pass", rationale: ["Incidents reported within established SLA criteria"], references: ["NIST-CSF:RS.CO-2"] }
    : { decision: "fail", rationale: ["Incident reporting SLA not met"], references: ["NIST-CSF:RS.CO-2"] };
}
