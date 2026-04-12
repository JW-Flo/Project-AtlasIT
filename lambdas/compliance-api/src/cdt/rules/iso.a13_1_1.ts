import { CdtEvent } from "../models.js";

// ISO 27001 A.13.1.1 – network segregation controls validated
export function evalISO_A13_1_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const seg = (ev.payload as any)?.segmentation_tests_passed === true;
  return seg
    ? {
        decision: "pass",
        rationale: ["Network segmentation tests passed"],
        references: ["ISO27001:A.13.1.1"],
      }
    : {
        decision: "fail",
        rationale: ["Network segmentation tests failed/unknown"],
        references: ["ISO27001:A.13.1.1"],
      };
}
