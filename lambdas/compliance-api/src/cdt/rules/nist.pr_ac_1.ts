import { CdtEvent } from "../models.js";

// NIST CSF PR.AC-1 – identities and credentials issued, managed, verified, revoked, and audited
export function evalNIST_PR_AC_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const idpConnected = (ev.payload as any)?.idp_connected === true;
  const automatedLifecycle = (ev.payload as any)?.automated_identity_lifecycle === true;
  if (idpConnected && automatedLifecycle) {
    return {
      decision: "pass",
      rationale: ["IdP connected with automated identity lifecycle management"],
      references: ["NIST-CSF:PR.AC-1"],
    };
  }
  const issues: string[] = [];
  if (!idpConnected) issues.push("Identity provider not connected");
  if (!automatedLifecycle) issues.push("Identity lifecycle not automated");
  return { decision: "fail", rationale: issues, references: ["NIST-CSF:PR.AC-1"] };
}
