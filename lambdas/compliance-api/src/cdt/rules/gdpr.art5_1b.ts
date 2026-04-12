import { CdtEvent } from "../models.js";

// GDPR Article 5(1)(b) – purpose limitation
export function evalGDPR_Art5_1b(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const purposeLimitationEnforced = (ev.payload as any)?.purpose_limitation_enforced === true;
  return purposeLimitationEnforced
    ? {
        decision: "pass",
        rationale: ["Data collected for specified, explicit, and legitimate purposes"],
        references: ["GDPR:Art.5(1)(b)"],
      }
    : {
        decision: "fail",
        rationale: ["Purpose limitation not documented or enforced"],
        references: ["GDPR:Art.5(1)(b)"],
      };
}
