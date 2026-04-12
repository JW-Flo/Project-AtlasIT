import { CdtEvent } from "../models.js";

// SOC2 CC3.2 – vendor/third-party risk assessed
export function evalSOC2_CC3_2(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const vendorRiskReviewed = (ev.payload as any)?.vendor_risk_reviewed === true;
  return vendorRiskReviewed
    ? {
        decision: "pass",
        rationale: ["Third-party vendor risk assessments current"],
        references: ["SOC2-CC3.2"],
      }
    : {
        decision: "fail",
        rationale: ["Vendor risk assessments incomplete or missing"],
        references: ["SOC2-CC3.2"],
      };
}
