import { CdtEvent } from "../models.js";

// SOC2 CC6.8 – anti-malware / endpoint protection
export function evalSOC2_CC6_8(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const endpointProtectionPct = (ev.payload as any)?.endpoint_protection_pct ?? 0;
  return endpointProtectionPct >= 95
    ? {
        decision: "pass",
        rationale: [`Endpoint protection deployed on ${endpointProtectionPct}% of devices`],
        references: ["SOC2-CC6.8"],
      }
    : {
        decision: "fail",
        rationale: [`Endpoint protection coverage ${endpointProtectionPct}% below 95%`],
        references: ["SOC2-CC6.8"],
      };
}
