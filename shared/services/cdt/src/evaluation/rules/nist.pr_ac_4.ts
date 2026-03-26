import { CdtEvent } from "../../models";

// NIST CSF PR.AC-4 – access permissions and authorizations managed, incorporating principles of least privilege
export function evalNIST_PR_AC_4(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const leastPrivilegeReviewed = (ev.payload as any)?.least_privilege_review_completed === true;
  return leastPrivilegeReviewed
    ? { decision: "pass", rationale: ["Least-privilege access permissions reviewed and current"], references: ["NIST-CSF:PR.AC-4"] }
    : { decision: "fail", rationale: ["Least-privilege review not completed"], references: ["NIST-CSF:PR.AC-4"] };
}
