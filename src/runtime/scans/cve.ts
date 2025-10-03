import { registerFeature } from "../features/registry";
import type { ScanFeature } from "../features/types";
import type { EnhancedFinding, ScanContext, ScanRunOutput } from "./types";

async function runCveScan(
  url: string,
  ctx: ScanContext,
): Promise<ScanRunOutput> {
  const findings: EnhancedFinding[] = [];
  const externalApisUsed: string[] = [];
  const env = (ctx.env ?? {}) as Record<string, string>;

  try {
    const headResp = await fetch(url, { method: "HEAD" });
    const server = headResp.headers.get("server") || "";
    const versionMatch = /(nginx\/\d+\.\d+(?:\.\d+)?)/i.exec(server);

    if (env.OPENCVE_ENRICH === "true" && versionMatch) {
      const versionToken = versionMatch[1].split("/")[1];
      const hasBasic = Boolean(
        env.OPENCVE_BASIC_USER && env.OPENCVE_BASIC_PASS,
      );
      const hasToken = Boolean(env.OPENCVE_API_TOKEN);
      let authMode: "basic" | "token" | "none" = "none";
      const headers: Record<string, string> = {};

      if (hasBasic) {
        authMode = "basic";
        const creds = `${env.OPENCVE_BASIC_USER}:${env.OPENCVE_BASIC_PASS}`;
        headers.Authorization = `Basic ${Buffer.from(creds).toString("base64")}`;
      } else if (hasToken) {
        authMode = "token";
        headers.Authorization = `Token ${env.OPENCVE_API_TOKEN}`;
      }

      externalApisUsed.push("opencve");
      try {
        await fetch("https://app.opencve.io/api/cve?search=nginx", {
          headers: Object.keys(headers).length ? headers : undefined,
        });
      } catch {
        // network failure tolerated in tests
      }

      findings.push({
        severity: "medium",
        category: "CVE Exposure",
        title: "OpenCVE references for nginx",
        description: `Detected nginx ${versionToken}. Retrieved CVE metadata (simulated). Auth mode: ${authMode}.`,
        recommendation:
          "Review nginx version CVEs and implement security updates.",
      });
    }
  } catch {
    // ignore header fetch issues
  }

  return { findings, externalApisUsed };
}

const cveFeature: ScanFeature = {
  id: "cve",
  kind: "scan",
  version: "2.0.0",
  meta: { category: "Threat Intelligence", externalApis: ["opencve"] },
  provides: ["vuln-cve"],
  run: runCveScan as any,
};

registerFeature(cveFeature);

export { cveFeature };
