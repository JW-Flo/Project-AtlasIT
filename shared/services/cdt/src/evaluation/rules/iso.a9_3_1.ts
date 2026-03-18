import { CdtEvent } from "../../models";

// ISO 27001 A.9.3.1 – users required to follow secure authentication practices
export function evalISO_A9_3_1(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const secureAuthTrainingPct = (ev.payload as any)?.secure_auth_training_pct ?? 0;
  return secureAuthTrainingPct >= 90
    ? { decision: "pass", rationale: [`${secureAuthTrainingPct}% of users completed secure authentication training`], references: ["ISO27001:A.9.3.1"] }
    : { decision: "fail", rationale: [`Secure auth training completion ${secureAuthTrainingPct}% below 90% threshold`], references: ["ISO27001:A.9.3.1"] };
}
