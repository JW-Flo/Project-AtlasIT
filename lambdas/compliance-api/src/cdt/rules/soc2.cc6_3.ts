import { CdtEvent } from "../models.js";

// SOC2 CC6.3 – offboarding / role change access removal within SLA
export function evalSOC2_CC6_3(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const offboardingHours = (ev.payload as any)?.access_revoke_hours ?? 9999;
  return offboardingHours <= 24
    ? {
        decision: "pass",
        rationale: [`Access revoked within ${offboardingHours}h of termination/role change`],
        references: ["SOC2-CC6.3"],
      }
    : {
        decision: "fail",
        rationale: [`Access revocation took ${offboardingHours}h (threshold: 24h)`],
        references: ["SOC2-CC6.3"],
      };
}
