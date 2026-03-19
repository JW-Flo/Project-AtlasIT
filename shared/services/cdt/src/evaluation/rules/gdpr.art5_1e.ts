import { CdtEvent } from "../../models";

// GDPR Article 5(1)(e) – storage limitation
export function evalGDPR_Art5_1e(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const retentionPolicyEnforced = (ev.payload as any)?.retention_policy_enforced === true;
  return retentionPolicyEnforced
    ? { decision: "pass", rationale: ["Data retention policy enforced with defined periods"], references: ["GDPR:Art.5(1)(e)"] }
    : { decision: "fail", rationale: ["No data retention policy or automatic deletion configured"], references: ["GDPR:Art.5(1)(e)"] };
}
