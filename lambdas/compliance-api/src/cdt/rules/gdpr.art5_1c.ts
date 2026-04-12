import { CdtEvent } from "../models.js";

// GDPR Article 5(1)(c) – data minimisation
export function evalGDPR_Art5_1c(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const dataMinimisationEnforced = (ev.payload as any)?.data_minimisation_enforced === true;
  return dataMinimisationEnforced
    ? {
        decision: "pass",
        rationale: ["Data collection limited to what is necessary for stated purpose"],
        references: ["GDPR:Art.5(1)(c)"],
      }
    : {
        decision: "fail",
        rationale: ["Data minimisation controls not enforced"],
        references: ["GDPR:Art.5(1)(c)"],
      };
}
