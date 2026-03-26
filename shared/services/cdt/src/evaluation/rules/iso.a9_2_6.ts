import { CdtEvent } from "../../models";

// ISO 27001 A.9.2.6 – removal or adjustment of access rights on termination/change
export function evalISO_A9_2_6(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const offboardingCompletedHours = (ev.payload as any)?.offboarding_access_revoke_hours ?? 9999;
  return offboardingCompletedHours <= 4
    ? { decision: "pass", rationale: [`All access rights removed within ${offboardingCompletedHours}h of termination`], references: ["ISO27001:A.9.2.6"] }
    : { decision: "fail", rationale: [`Access removal took ${offboardingCompletedHours}h (threshold: 4h)`], references: ["ISO27001:A.9.2.6"] };
}
