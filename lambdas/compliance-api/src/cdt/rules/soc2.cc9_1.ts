import { CdtEvent } from "../models.js";

// SOC2 CC9.1 – risk mitigation activities address identified risks
export function evalSOC2_CC9_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const unmitgatedHighRisks = (ev.payload as any)?.unmitigated_high_risks ?? 0;
  return unmitgatedHighRisks === 0
    ? {
        decision: "pass",
        rationale: ["All high risks have mitigation plans in place"],
        references: ["SOC2-CC9.1"],
      }
    : {
        decision: "fail",
        rationale: [`${unmitgatedHighRisks} high risks lack mitigation plans`],
        references: ["SOC2-CC9.1"],
      };
}
