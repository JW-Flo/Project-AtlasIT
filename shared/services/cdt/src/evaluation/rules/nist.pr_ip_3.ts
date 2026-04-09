import { CdtEvent } from "../../models";

// NIST CSF PR.IP-3 – configuration change control processes are in place
export function evalNIST_PR_IP_3(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const automationRulesActive = (ev.payload as any)?.automation_rules_active === true;
  const changeManagementProcess = (ev.payload as any)?.change_management_process === true;
  if (automationRulesActive || changeManagementProcess) {
    return {
      decision: "pass",
      rationale: ["Configuration change control processes active via automation rules"],
      references: ["NIST-CSF:PR.IP-3"],
    };
  }
  return {
    decision: "fail",
    rationale: ["No configuration change control processes detected"],
    references: ["NIST-CSF:PR.IP-3"],
  };
}
