import { CdtEvent } from "../models.js";

// HIPAA 164.312(b) – audit controls: activity logs for PHI access
export function evalHIPAA_164_312_b(ev: CdtEvent): {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
} {
  const auditLogsEnabled = (ev.payload as any)?.phi_audit_logs_enabled === true;
  const retentionDays = (ev.payload as any)?.audit_log_retention_days ?? 0;
  if (auditLogsEnabled && retentionDays >= 365) {
    return {
      decision: "pass",
      rationale: [`PHI access audit logs enabled with ${retentionDays}-day retention`],
      references: ["HIPAA:164.312(b)"],
    };
  }
  const issues: string[] = [];
  if (!auditLogsEnabled) issues.push("PHI audit logs not enabled");
  if (retentionDays < 365)
    issues.push(`Audit log retention ${retentionDays} days below 365-day minimum`);
  return { decision: "fail", rationale: issues, references: ["HIPAA:164.312(b)"] };
}
