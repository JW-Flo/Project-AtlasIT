import { CdtEvent } from "../models.js";

// SOC2 CC9.2 – business continuity and disaster recovery plans
export function evalSOC2_CC9_2(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const bcrExists = (ev.payload as any)?.bcr_plan_exists === true;
  const daysSinceBcrTest = (ev.payload as any)?.days_since_bcr_test ?? 999;
  if (bcrExists && daysSinceBcrTest <= 365) {
    return {
      decision: "pass",
      rationale: ["BCR/DR plan exists and tested within 365 days"],
      references: ["SOC2-CC9.2"],
    };
  }
  const issues: string[] = [];
  if (!bcrExists) issues.push("BCR/DR plan not documented");
  if (daysSinceBcrTest > 365) issues.push(`BCR/DR test overdue (${daysSinceBcrTest} days ago)`);
  return { decision: "fail", rationale: issues, references: ["SOC2-CC9.2"] };
}
