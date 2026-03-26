import { CdtEvent } from "../../models";

// GDPR Article 5(1)(d) – accuracy
export function evalGDPR_Art5_1d(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const dataAccuracyControls = (ev.payload as any)?.data_accuracy_controls === true;
  return dataAccuracyControls
    ? { decision: "pass", rationale: ["Data accuracy controls in place with correction procedures"], references: ["GDPR:Art.5(1)(d)"] }
    : { decision: "fail", rationale: ["No data accuracy or correction procedures documented"], references: ["GDPR:Art.5(1)(d)"] };
}
