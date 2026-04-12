import { CdtEvent } from "../models.js";

// SOC2 CC2.1 – security policies communicated to personnel
export function evalSOC2_CC2_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const pctAcknowledged = (ev.payload as any)?.policy_acknowledgement_pct ?? 0;
  return pctAcknowledged >= 90
    ? {
        decision: "pass",
        rationale: [`Security policies acknowledged by ${pctAcknowledged}% of personnel`],
        references: ["SOC2-CC2.1"],
      }
    : {
        decision: "fail",
        rationale: [`Policy acknowledgement ${pctAcknowledged}% is below 90% threshold`],
        references: ["SOC2-CC2.1"],
      };
}
