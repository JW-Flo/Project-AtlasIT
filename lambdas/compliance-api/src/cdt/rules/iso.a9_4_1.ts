import { CdtEvent } from "../models.js";

// ISO 27001 A.9.4.1 – information access restricted based on access control policy
export function evalISO_A9_4_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const ok = (ev.payload as any)?.role_based_access_enforced === true;
  return ok
    ? {
        decision: "pass",
        rationale: ["Role-based access control enforced on all systems"],
        references: ["ISO27001:A.9.4.1"],
      }
    : {
        decision: "fail",
        rationale: ["RBAC not enforced — unauthorized information access risk"],
        references: ["ISO27001:A.9.4.1"],
      };
}
