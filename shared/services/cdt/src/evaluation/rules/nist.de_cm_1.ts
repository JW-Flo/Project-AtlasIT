import { CdtEvent } from "../../models";

// NIST CSF DE.CM-1 – network and infrastructure monitored for potential cybersecurity events
export function evalNIST_DE_CM_1(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const networkMonitoringEnabled = (ev.payload as any)?.network_monitoring_enabled === true;
  const siemConnected = (ev.payload as any)?.siem_connected === true;
  if (networkMonitoringEnabled && siemConnected) {
    return { decision: "pass", rationale: ["Network monitoring active with SIEM integration"], references: ["NIST-CSF:DE.CM-1"] };
  }
  const issues: string[] = [];
  if (!networkMonitoringEnabled) issues.push("Network monitoring not enabled");
  if (!siemConnected) issues.push("SIEM not connected");
  return { decision: "fail", rationale: issues, references: ["NIST-CSF:DE.CM-1"] };
}
