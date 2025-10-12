import { CdtEvent } from "../../models";

// ISO 27001 A.9.4.2 – strong authentication (WebAuthn/FIDO2)
export function evalISO_A9_4_2(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const mfa = (ev.payload as any)?.mfa_types_allowed ?? [];
  return (Array.isArray(mfa) && (mfa.includes("WebAuthn") || mfa.includes("FIDO2")))
    ? { decision: "pass", rationale: ["Strong MFA (WebAuthn/FIDO2) enabled"], references: ["ISO27001:A.9.4.2"] }
    : { decision: "fail", rationale: ["Strong MFA not enabled"], references: ["ISO27001:A.9.4.2"] };
}
