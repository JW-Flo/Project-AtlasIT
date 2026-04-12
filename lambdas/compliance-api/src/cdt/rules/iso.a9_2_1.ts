import { CdtEvent } from "../models.js";

// ISO 27001 A.9.2.1 – user registration and de-registration process
export function evalISO_A9_2_1(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const ok = (ev.payload as any)?.user_lifecycle_process_documented === true;
  return ok
    ? {
        decision: "pass",
        rationale: ["User registration and de-registration process documented"],
        references: ["ISO27001:A.9.2.1"],
      }
    : {
        decision: "fail",
        rationale: ["User lifecycle process not documented"],
        references: ["ISO27001:A.9.2.1"],
      };
}
