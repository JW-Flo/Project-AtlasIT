import { CdtEvent } from "../models.js";

// ISO 27001 A.9.2.4 – management of secret authentication information
export function evalISO_A9_2_4(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const secretsManagedInVault = (ev.payload as any)?.secrets_managed_in_vault === true;
  return secretsManagedInVault
    ? {
        decision: "pass",
        rationale: ["Secret authentication information managed in approved vault"],
        references: ["ISO27001:A.9.2.4"],
      }
    : {
        decision: "fail",
        rationale: ["Secrets not managed in vault (risk of plaintext exposure)"],
        references: ["ISO27001:A.9.2.4"],
      };
}
