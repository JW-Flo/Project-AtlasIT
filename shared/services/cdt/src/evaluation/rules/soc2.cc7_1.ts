import { CdtEvent } from "../../models";

// SOC2 CC7.1 – system components monitored for anomalies
export function evalSOC2_CC7_1(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const ok = (ev.payload as any)?.anomaly_detection_enabled === true;
  return ok
    ? { decision: "pass", rationale: ["Anomaly detection is active on system components"], references: ["SOC2-CC7.1"] }
    : { decision: "fail", rationale: ["Anomaly detection not enabled"], references: ["SOC2-CC7.1"] };
}
