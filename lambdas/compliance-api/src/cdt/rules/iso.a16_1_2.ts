import { CdtEvent } from "../models.js";

// ISO 27001 A.16.1.2 – information security events reported through management channels
export function evalISO_A16_1_2(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const reportingChannelExists = (ev.payload as any)?.security_event_reporting_channel === true;
  return reportingChannelExists
    ? {
        decision: "pass",
        rationale: ["Security event reporting channel established and communicated"],
        references: ["ISO27001:A.16.1.2"],
      }
    : {
        decision: "fail",
        rationale: ["No security event reporting channel defined"],
        references: ["ISO27001:A.16.1.2"],
      };
}
