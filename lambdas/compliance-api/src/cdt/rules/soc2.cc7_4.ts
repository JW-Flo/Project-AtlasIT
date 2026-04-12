import { CdtEvent } from "../models.js";

// SOC2 CC7.4 – security incidents identified and contained within SLA
export function evalSOC2_CC7_4(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const openCriticalIncidents = (ev.payload as any)?.open_critical_incidents ?? 0;
  const meanTimeToContainHours = (ev.payload as any)?.mean_time_to_contain_hours ?? 9999;
  if (openCriticalIncidents === 0 && meanTimeToContainHours <= 4) {
    return {
      decision: "pass",
      rationale: ["No open critical incidents; MTTC within 4h SLA"],
      references: ["SOC2-CC7.4"],
    };
  }
  const issues: string[] = [];
  if (openCriticalIncidents > 0) issues.push(`${openCriticalIncidents} critical incidents open`);
  if (meanTimeToContainHours > 4) issues.push(`MTTC ${meanTimeToContainHours}h exceeds 4h SLA`);
  return { decision: "fail", rationale: issues, references: ["SOC2-CC7.4"] };
}
