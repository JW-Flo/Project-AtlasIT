import { CdtEvent } from "../../models";

// SOC2 CC5.2 – technology controls (automated enforcement)
export function evalSOC2_CC5_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const automatedControlsPct = (ev.payload as any)?.automated_controls_pct ?? 0;
  return automatedControlsPct >= 70
    ? { decision: "pass", rationale: [`${automatedControlsPct}% of controls are automated`], references: ["SOC2-CC5.2"] }
    : { decision: "fail", rationale: [`Only ${automatedControlsPct}% of controls automated (threshold: 70%)`], references: ["SOC2-CC5.2"] };
}
