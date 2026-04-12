import { CdtEvent } from "../models.js";

// SOC2 CC6.1 – logical access provisioning based on least privilege
export function evalSOC2_CC6_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const ok = (ev.payload as any)?.least_privilege_enforced === true;
  return ok
    ? {
        decision: "pass",
        rationale: ["Least-privilege access policy enforced for provisioning"],
        references: ["SOC2-CC6.1"],
      }
    : {
        decision: "fail",
        rationale: ["Least-privilege policy not enforced"],
        references: ["SOC2-CC6.1"],
      };
}
