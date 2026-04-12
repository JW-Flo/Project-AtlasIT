import { CdtEvent } from "../models.js";

// HIPAA 164.312(c)(1) – integrity: PHI protected from improper alteration or destruction
export function evalHIPAA_164_312_c1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const integrityControlsEnabled = (ev.payload as any)?.phi_integrity_controls === true;
  return integrityControlsEnabled
    ? {
        decision: "pass",
        rationale: ["PHI integrity controls (checksums/hashing) enabled"],
        references: ["HIPAA:164.312(c)(1)"],
      }
    : {
        decision: "fail",
        rationale: ["PHI integrity controls not implemented"],
        references: ["HIPAA:164.312(c)(1)"],
      };
}
