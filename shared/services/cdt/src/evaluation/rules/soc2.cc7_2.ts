import { CdtEvent } from "../../models";

// SOC2 CC7.2 – vulnerability remediation SLA
export function evalSOC2_CC7_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const { critical_open, critical_sla_hours } = (ev.payload as any) ?? {};
  const open = critical_open ?? 0;
  const sla = critical_sla_hours ?? 9999;
  return (open === 0 || sla <= 72)
    ? { decision: "pass", rationale: ["Critical vulns remediated within 72h"], references: ["SOC2-CC7.2"] }
    : { decision: "fail", rationale: ["Critical vulns exceed 72h SLA"], references: ["SOC2-CC7.2"] };
}
