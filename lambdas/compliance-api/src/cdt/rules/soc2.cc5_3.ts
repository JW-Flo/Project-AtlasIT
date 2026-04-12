import { CdtEvent } from "../models.js";

// SOC2 CC5.3 – change management controls over infrastructure and code
export function evalSOC2_CC5_3(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const approvedChangePct = (ev.payload as any)?.approved_change_pct ?? 0;
  return approvedChangePct >= 95
    ? {
        decision: "pass",
        rationale: [`${approvedChangePct}% of changes went through formal approval`],
        references: ["SOC2-CC5.3"],
      }
    : {
        decision: "fail",
        rationale: [`Change approval rate ${approvedChangePct}% below 95% threshold`],
        references: ["SOC2-CC5.3"],
      };
}
