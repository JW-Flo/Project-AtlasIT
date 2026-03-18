import { CdtEvent } from "../../models";

// SOC2 CC4.1 – ongoing monitoring of internal controls
export function evalSOC2_CC4_1(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const monitoringActive = (ev.payload as any)?.continuous_monitoring_enabled === true;
  return monitoringActive
    ? { decision: "pass", rationale: ["Continuous monitoring of controls is active"], references: ["SOC2-CC4.1"] }
    : { decision: "fail", rationale: ["Continuous monitoring not enabled"], references: ["SOC2-CC4.1"] };
}
