import { CdtEvent } from "../models.js";

// SOC2 CC5.1 – control activities (policies and procedures) defined and enforced
export function evalSOC2_CC5_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const ok = (ev.payload as any)?.control_activities_documented === true;
  return ok
    ? {
        decision: "pass",
        rationale: ["Control activities documented and mapped to risks"],
        references: ["SOC2-CC5.1"],
      }
    : {
        decision: "fail",
        rationale: ["Control activities not documented"],
        references: ["SOC2-CC5.1"],
      };
}
