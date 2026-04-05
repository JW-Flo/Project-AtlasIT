import { CdtEvent } from "../../models";

// HIPAA 164.312(a)(2)(iv) – encryption and decryption of ePHI
export function evalHIPAA_164_312_a2iv(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const encryptionAtRest = (ev.payload as any)?.encryption_at_rest === true;
  const encryptionInTransit = (ev.payload as any)?.encryption_in_transit === true;
  if (encryptionAtRest && encryptionInTransit) {
    return {
      decision: "pass",
      rationale: ["ePHI encrypted at rest and in transit"],
      references: ["HIPAA:164.312(a)(2)(iv)"],
    };
  }
  const issues: string[] = [];
  if (!encryptionAtRest) issues.push("Encryption at rest not confirmed");
  if (!encryptionInTransit) issues.push("Encryption in transit not confirmed");
  return { decision: "fail", rationale: issues, references: ["HIPAA:164.312(a)(2)(iv)"] };
}
