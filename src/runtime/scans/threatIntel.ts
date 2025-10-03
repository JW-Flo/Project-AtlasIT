import { registerFeature } from "../features/registry";
import type { ScanFeature } from "../features/types";
import type { EnhancedFinding, ScanContext, ScanRunOutput } from "./types";

async function runThreatIntel(
  url: string,
  ctx: ScanContext,
): Promise<ScanRunOutput> {
  const findings: EnhancedFinding[] = [];
  const externalApisUsed: string[] = [];
  const env = (ctx.env ?? {}) as Record<string, string>;
  const urlObj = new URL(url);

  const vtKey = env.VIRUSTOTAL_API_KEY;
  if (!vtKey) {
    findings.push({
      severity: "info",
      category: "Threat Intelligence",
      title: "VirusTotal API Key Not Configured",
      description: "VirusTotal enrichment skipped (no API key).",
      recommendation:
        "Provide a VirusTotal API key to enable threat intelligence lookups.",
    });
    return { findings };
  }

  externalApisUsed.push("virustotal");
  try {
    const vtResponse = await fetch(
      `https://www.virustotal.com/api/v3/domains/${urlObj.hostname}`,
      {
        headers: {
          "x-apikey": vtKey,
        },
      },
    );

    if (vtResponse.ok) {
      const body: any = await vtResponse.json();
      const stats = body?.data?.attributes?.last_analysis_stats;
      if (stats && typeof stats.malicious === "number") {
        const malicious = stats.malicious ?? 0;
        const suspicious = stats.suspicious ?? 0;
        const harmless = stats.harmless ?? 0;

        if (malicious > 0) {
          findings.push({
            severity: "high",
            category: "Threat Intelligence",
            title: "VirusTotal Domain Reputation",
            description: `Automated analysis indicates malicious: ${malicious}, suspicious: ${suspicious}, harmless: ${harmless}`,
            recommendation:
              "Investigate domain reputation and remediate as needed.",
          });
        } else {
          findings.push({
            severity: "info",
            category: "Threat Intelligence",
            title: "VirusTotal Domain Reputation",
            description:
              "VirusTotal reports no malicious activity for this domain.",
          });
        }
      }
    } else {
      findings.push({
        severity: "warning",
        category: "Threat Intelligence",
        title: "VirusTotal Lookup Failed",
        description: `VirusTotal API responded with status ${vtResponse.status}.`,
        recommendation: "Verify API key permissions and retry.",
      });
    }
  } catch (error) {
    findings.push({
      severity: "warning",
      category: "Threat Intelligence",
      title: "VirusTotal Lookup Error",
      description: `VirusTotal enrichment failed: ${String(error)}`,
      recommendation: "Retry later or validate network connectivity.",
    });
  }

  return { findings, externalApisUsed };
}

const threatIntelFeature: ScanFeature = {
  id: "threat-intel",
  kind: "scan",
  version: "2.0.0",
  meta: { category: "Threat Intelligence", externalApis: ["virustotal"] },
  provides: ["threat-intel"],
  run: runThreatIntel as any,
};

registerFeature(threatIntelFeature);

export { threatIntelFeature };
