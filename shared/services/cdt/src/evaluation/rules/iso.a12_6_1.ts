import { CdtEvent } from "../../models";

// ISO 27001 A.12.6.1 – anti-malware / EDR coverage threshold
export function evalISO_A12_6_1(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const cov = (ev.payload as any)?.edr_coverage_pct ?? 0;
  return cov >= 95
    ? { decision: "pass", rationale: ["EDR coverage ≥95%"], references: ["ISO27001:A.12.6.1"] }
    : { decision: "fail", rationale: ["EDR coverage "+cov+"% <95%"], references: ["ISO27001:A.12.6.1"] };
}
