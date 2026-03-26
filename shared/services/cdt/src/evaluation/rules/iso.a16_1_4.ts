import { CdtEvent } from "../../models";

// ISO 27001 A.16.1.4 – assessment and decision on information security events
export function evalISO_A16_1_4(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const triageTimeHours = (ev.payload as any)?.incident_triage_time_hours ?? 9999;
  return triageTimeHours <= 2
    ? { decision: "pass", rationale: [`Security events triaged within ${triageTimeHours}h (threshold: 2h)`], references: ["ISO27001:A.16.1.4"] }
    : { decision: "fail", rationale: [`Security event triage time ${triageTimeHours}h exceeds 2h threshold`], references: ["ISO27001:A.16.1.4"] };
}
