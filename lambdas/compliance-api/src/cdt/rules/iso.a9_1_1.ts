import { CdtEvent } from "../models.js";

// ISO 27001 A.9.1.1 – access control policy documented and approved
export function evalISO_A9_1_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const ok = (ev.payload as any)?.access_control_policy_approved === true;
  return ok
    ? {
        decision: "pass",
        rationale: ["Access control policy documented and management-approved"],
        references: ["ISO27001:A.9.1.1"],
      }
    : {
        decision: "fail",
        rationale: ["Access control policy missing or not approved"],
        references: ["ISO27001:A.9.1.1"],
      };
}
