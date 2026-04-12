import { CdtEvent } from "../models.js";

// SOC2 CC1.2 – board and management oversight of internal controls
export function evalSOC2_CC1_2(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const ok = (ev.payload as any)?.board_oversight_documented === true;
  return ok
    ? {
        decision: "pass",
        rationale: ["Board and management oversight of internal controls documented"],
        references: ["SOC2-CC1.2"],
      }
    : {
        decision: "fail",
        rationale: ["Board oversight documentation missing"],
        references: ["SOC2-CC1.2"],
      };
}
