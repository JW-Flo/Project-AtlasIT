import { CdtEvent } from "../models.js";

// SOC2 CC6.7 – encryption of data in transit and at rest
export function evalSOC2_CC6_7(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const inTransit = (ev.payload as any)?.encryption_in_transit === true;
  const atRest = (ev.payload as any)?.encryption_at_rest === true;
  if (inTransit && atRest) {
    return {
      decision: "pass",
      rationale: ["Data encrypted in transit and at rest"],
      references: ["SOC2-CC6.7"],
    };
  }
  const missing: string[] = [];
  if (!inTransit) missing.push("in-transit");
  if (!atRest) missing.push("at-rest");
  return {
    decision: "fail",
    rationale: [`Encryption missing for: ${missing.join(", ")}`],
    references: ["SOC2-CC6.7"],
  };
}
