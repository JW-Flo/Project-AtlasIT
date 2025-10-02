import { registerFeature } from "../features/registry";
import type { ScanFeature } from "../features/types";
import type { EnhancedFinding, ScanContext, ScanRunOutput } from "./types";

async function runInformationDisclosure(
  url: string,
  ctx: ScanContext,
): Promise<ScanRunOutput> {
  const findings: EnhancedFinding[] = [];

  const sensitiveFiles = [
    {
      path: "/.env",
      severity: "critical" as const,
      description: "Environment configuration file with potential secrets",
      businessImpact:
        "CRITICAL: Database passwords, API keys exposed to attackers",
      costEstimate: { currency: "USD", amount: 50000, timeframe: "one-time" },
    },
    {
      path: "/.git/config",
      severity: "high" as const,
      description: "Git configuration exposing development information",
      businessImpact:
        "High: Source code structure and development practices exposed",
      costEstimate: { currency: "USD", amount: 5000, timeframe: "one-time" },
    },
    {
      path: "/backup.sql",
      severity: "critical" as const,
      description: "Database backup file potentially accessible",
      businessImpact: "CRITICAL: Complete customer database exposed",
      costEstimate: { currency: "USD", amount: 10000, timeframe: "one-time" },
    },
    {
      path: "/config.php",
      severity: "high" as const,
      description: "PHP configuration file may contain sensitive data",
      businessImpact:
        "High: Database connections and application secrets exposed",
      costEstimate: { currency: "USD", amount: 10000, timeframe: "one-time" },
    },
  ];

  for (const file of sensitiveFiles) {
    try {
      const testUrl = new URL(file.path, url).toString();
      const response = await fetch(testUrl, {
        method: "HEAD",
        headers: { "User-Agent": "Enhanced-Security-Scanner/2.0" },
      });

      if (response.ok) {
        findings.push({
          severity: file.severity,
          category: "Information Disclosure",
          title: `Sensitive File Exposed: ${file.path}`,
          description: file.description,
          businessImpact: file.businessImpact,
          recommendation:
            "Immediately restrict access and move sensitive files outside web root",
          costEstimate: file.costEstimate,
          technicalDetails: ctx.superAdminMode
            ? {
                remediationSteps: [
                  `URL: ${testUrl}\nStatus: ${response.status}`,
                ],
              }
            : undefined,
        });
      }
    } catch {
      // Unable to fetch file; treat as non-issue
    }
  }

  try {
    const securityTxtResponse = await fetch(
      new URL("/.well-known/security.txt", url).toString(),
    );
    if (securityTxtResponse.ok) {
      findings.push({
        severity: "excellent",
        category: "Information Disclosure",
        title: "Security.txt Available",
        description:
          "The site publishes a security.txt for coordinated disclosure.",
        recommendation: "Ensure contact and policy details remain up to date.",
      });
    }
  } catch {
    // ignore
  }

  findings.push({
    severity: "info",
    category: "Tech Stack",
    title: "Passive Technology Fingerprinting",
    description:
      "Analysis performed for technology disclosures and third-party integrations.",
  });

  return { findings };
}

const infoFeature: ScanFeature = {
  id: "info",
  kind: "scan",
  version: "2.0.0",
  meta: { category: "Information Disclosure" },
  provides: ["meta"],
  run: runInformationDisclosure as any,
};

registerFeature(infoFeature);

export { infoFeature };
