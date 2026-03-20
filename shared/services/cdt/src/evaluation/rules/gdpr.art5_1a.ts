import { CdtEvent } from "../../models";

// GDPR Article 5(1)(a) – lawfulness, fairness, transparency
export function evalGDPR_Art5_1a(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const dataProcessingLawful = (ev.payload as any)?.data_processing_lawful === true;
  return dataProcessingLawful
    ? { decision: "pass", rationale: ["Data processing has documented legal basis and transparency notices"], references: ["GDPR:Art.5(1)(a)"] }
    : { decision: "fail", rationale: ["No documented legal basis for data processing"], references: ["GDPR:Art.5(1)(a)"] };
}
