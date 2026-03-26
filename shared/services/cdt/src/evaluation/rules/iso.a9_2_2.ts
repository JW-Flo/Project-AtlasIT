import { CdtEvent } from "../../models";

// ISO 27001 A.9.2.2 – user access provisioning with formal authorization
export function evalISO_A9_2_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const approvalRequired = (ev.payload as any)?.access_request_approval_required === true;
  return approvalRequired
    ? { decision: "pass", rationale: ["Formal approval required for all access provisioning"], references: ["ISO27001:A.9.2.2"] }
    : { decision: "fail", rationale: ["Access provisioning without formal approval process"], references: ["ISO27001:A.9.2.2"] };
}
