import { CdtEvent } from "../../models";

// ISO 27001 A.9.2.5 – periodic review of user access rights
export function evalISO_A9_2_5(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const daysSinceAccessReview = (ev.payload as any)?.days_since_access_review ?? 999;
  return daysSinceAccessReview <= 90
    ? { decision: "pass", rationale: [`Access rights reviewed ${daysSinceAccessReview} days ago (within 90-day cycle)`], references: ["ISO27001:A.9.2.5"] }
    : { decision: "fail", rationale: [`Access review overdue: last completed ${daysSinceAccessReview} days ago`], references: ["ISO27001:A.9.2.5"] };
}
