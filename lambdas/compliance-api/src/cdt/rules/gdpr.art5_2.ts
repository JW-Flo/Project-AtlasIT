import { CdtEvent } from "../models.js";

// GDPR Article 5(2) – accountability
export function evalGDPR_Art5_2(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const auditTrailEnabled = (ev.payload as any)?.audit_trail_enabled === true;
  return auditTrailEnabled
    ? {
        decision: "pass",
        rationale: ["Audit trail demonstrates compliance with data protection principles"],
        references: ["GDPR:Art.5(2)"],
      }
    : {
        decision: "fail",
        rationale: ["No audit trail to demonstrate accountability for data processing"],
        references: ["GDPR:Art.5(2)"],
      };
}
