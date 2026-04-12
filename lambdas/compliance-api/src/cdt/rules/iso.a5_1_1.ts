import { CdtEvent } from "../models.js";

// ISO 27001 A.5.1.1 – policies for information security defined, approved, published
export function evalISO_A5_1_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const policiesPublished = (ev.payload as any)?.policies_published === true;
  const policyCount = (ev.payload as any)?.policy_count ?? 0;
  if (policiesPublished || policyCount > 0) {
    return {
      decision: "pass",
      rationale: [`Information security policies published (${policyCount} policies uploaded)`],
      references: ["ISO27001:A.5.1.1"],
    };
  }
  return {
    decision: "fail",
    rationale: ["No information security policies published or uploaded"],
    references: ["ISO27001:A.5.1.1"],
  };
}
