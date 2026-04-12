import { CdtEvent } from "../models.js";

// SOC2 CC8.1 – change management: all changes authorized before implementation
export function evalSOC2_CC8_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const unauthorizedChanges = (ev.payload as any)?.unauthorized_changes_last_30d ?? 0;
  return unauthorizedChanges === 0
    ? {
        decision: "pass",
        rationale: ["No unauthorized changes in last 30 days"],
        references: ["SOC2-CC8.1"],
      }
    : {
        decision: "fail",
        rationale: [`${unauthorizedChanges} unauthorized changes detected in last 30 days`],
        references: ["SOC2-CC8.1"],
      };
}
