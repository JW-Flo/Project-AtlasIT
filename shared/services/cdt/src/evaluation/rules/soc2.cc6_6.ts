import { CdtEvent } from "../../models";

// SOC2 CC6.6 – logical access security measures for external-facing systems
export function evalSOC2_CC6_6(ev: CdtEvent): { decision: "pass"|"fail"|"unknown", rationale: string[], references: string[] } {
  const tlsVersion = (ev.payload as any)?.min_tls_version ?? "none";
  const ok = tlsVersion === "TLS1.2" || tlsVersion === "TLS1.3";
  return ok
    ? { decision: "pass", rationale: [`External systems enforce TLS ${tlsVersion}`], references: ["SOC2-CC6.6"] }
    : { decision: "fail", rationale: ["External systems do not enforce TLS 1.2+"], references: ["SOC2-CC6.6"] };
}
