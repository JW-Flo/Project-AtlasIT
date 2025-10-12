import { CdtEvent } from "../../models";

// SOC2 CC1.1 – logical access provisioning policy present
export function evalSOC2_CC1_1(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const ok = (ev.payload as any)?.access_policy_version?.length > 0;
  return ok
    ? { decision: "pass", rationale: ["Access policy versioned & published"], references: ["SOC2-CC1.1"] }
    : { decision: "fail", rationale: ["Access policy missing/unversioned"], references: ["SOC2-CC1.1"] };
}
