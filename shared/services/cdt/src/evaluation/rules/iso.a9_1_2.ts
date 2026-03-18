import { CdtEvent } from "../../models";

// ISO 27001 A.9.1.2 – access to networks and network services restricted
export function evalISO_A9_1_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const networkAccessReviewed = (ev.payload as any)?.network_access_rules_reviewed === true;
  return networkAccessReviewed
    ? { decision: "pass", rationale: ["Network access rules reviewed and least-privilege applied"], references: ["ISO27001:A.9.1.2"] }
    : { decision: "fail", rationale: ["Network access rules not reviewed"], references: ["ISO27001:A.9.1.2"] };
}
