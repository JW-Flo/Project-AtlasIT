import { CdtEvent } from "../../models";

// NIST CSF PR.AC-3 – remote access managed
export function evalNIST_PR_AC_3(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const remoteAccessControlled = (ev.payload as any)?.remote_access_controlled === true;
  const vpnOrZtnaEnabled = (ev.payload as any)?.vpn_or_ztna_enabled === true;
  if (remoteAccessControlled && vpnOrZtnaEnabled) {
    return { decision: "pass", rationale: ["Remote access managed with VPN or ZTNA controls"], references: ["NIST-CSF:PR.AC-3"] };
  }
  const issues: string[] = [];
  if (!remoteAccessControlled) issues.push("Remote access not controlled");
  if (!vpnOrZtnaEnabled) issues.push("VPN or ZTNA not enabled");
  return { decision: "fail", rationale: issues, references: ["NIST-CSF:PR.AC-3"] };
}
