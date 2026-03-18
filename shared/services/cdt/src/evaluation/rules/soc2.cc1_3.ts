import { CdtEvent } from "../../models";

// SOC2 CC1.3 – organizational structure and reporting lines defined
export function evalSOC2_CC1_3(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const ok = (ev.payload as any)?.org_chart_published === true;
  return ok
    ? { decision: "pass", rationale: ["Organizational structure and reporting lines published"], references: ["SOC2-CC1.3"] }
    : { decision: "fail", rationale: ["Org chart or reporting lines not documented"], references: ["SOC2-CC1.3"] };
}
