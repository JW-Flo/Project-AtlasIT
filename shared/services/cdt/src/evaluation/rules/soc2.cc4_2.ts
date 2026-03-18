import { CdtEvent } from "../../models";

// SOC2 CC4.2 – independent evaluation of controls (internal audit)
export function evalSOC2_CC4_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const daysSinceAudit = (ev.payload as any)?.days_since_internal_audit ?? 999;
  return daysSinceAudit <= 365
    ? { decision: "pass", rationale: [`Internal audit completed ${daysSinceAudit} days ago`], references: ["SOC2-CC4.2"] }
    : { decision: "fail", rationale: [`Internal audit overdue: last completed ${daysSinceAudit} days ago`], references: ["SOC2-CC4.2"] };
}
