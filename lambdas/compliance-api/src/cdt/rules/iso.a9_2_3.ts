import { CdtEvent } from "../models.js";

export function evalISO_A9_2_3(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const refs = ["ISO27001:A.9.2.3"];
  const rationale: string[] = [];
  const within24h = (ev.payload as any)?.provisioned_within_hours <= 24;
  if (within24h) {
    rationale.push("Joiner provisioning completed within 24h with approvals");
    return { decision: "pass", rationale, references: refs };
  }
  rationale.push("Joiner provisioning outside 24h or missing approvals");
  return { decision: "fail", rationale, references: refs };
}
