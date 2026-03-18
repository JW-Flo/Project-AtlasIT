import { CdtEvent } from "../../models";

// SOC2 CC2.2 – internal communication of control deficiencies
export function evalSOC2_CC2_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const ok = (ev.payload as any)?.deficiency_reporting_process_exists === true;
  return ok
    ? { decision: "pass", rationale: ["Deficiency reporting and escalation process documented"], references: ["SOC2-CC2.2"] }
    : { decision: "fail", rationale: ["No deficiency reporting/escalation process found"], references: ["SOC2-CC2.2"] };
}
