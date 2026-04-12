import { CdtEvent } from "../models.js";

// SOC2 CC7.3 – incident response plan exists and is tested
export function evalSOC2_CC7_3(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const planExists = (ev.payload as any)?.incident_response_plan_exists === true;
  const daysSinceTest = (ev.payload as any)?.days_since_irt_test ?? 999;
  if (planExists && daysSinceTest <= 365) {
    return {
      decision: "pass",
      rationale: ["Incident response plan exists and tested within last 365 days"],
      references: ["SOC2-CC7.3"],
    };
  }
  const issues: string[] = [];
  if (!planExists) issues.push("IRP not documented");
  if (daysSinceTest > 365) issues.push(`IRP test overdue (${daysSinceTest} days ago)`);
  return { decision: "fail", rationale: issues, references: ["SOC2-CC7.3"] };
}
