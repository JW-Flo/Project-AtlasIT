import { CdtEvent } from "../models.js";

// SOC2 CC3.1 – risk assessment process defined and executed
export function evalSOC2_CC3_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const daysSinceAssessment = (ev.payload as any)?.days_since_risk_assessment ?? 999;
  return daysSinceAssessment <= 365
    ? {
        decision: "pass",
        rationale: [
          `Risk assessment completed ${daysSinceAssessment} days ago (within 365-day cycle)`,
        ],
        references: ["SOC2-CC3.1"],
      }
    : {
        decision: "fail",
        rationale: [`Risk assessment overdue: ${daysSinceAssessment} days since last assessment`],
        references: ["SOC2-CC3.1"],
      };
}
