import { registerFeature } from "../features/registry";
import type { ScanFeature } from "../features/types";
import type { EnhancedFinding, ScanContext, ScanRunOutput } from "./types";

const FAST_TIMEOUT_MS = 3000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FAST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...(init || {}), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function runSslScan(
  url: string,
  ctx: ScanContext,
): Promise<ScanRunOutput> {
  const findings: EnhancedFinding[] = [];
  const targetUrl = new URL(url);

  if (targetUrl.protocol === "http:") {
    try {
      const httpsUrl = new URL(url.replace(/^http:/, "https:"));
      const httpsResp = await fetchWithTimeout(httpsUrl.toString(), {
        method: "HEAD",
      });
      if (httpsResp.ok) {
        findings.push({
          severity: "excellent",
          category: "SSL/TLS",
          title: "HTTPS Successfully Enabled",
          description: "The website is properly configured with HTTPS.",
          recommendation:
            "Continue monitoring SSL certificate expiration and renew as needed.",
          businessImpact:
            "HTTPS encryption protects user data and builds customer trust.",
        });
        const hsts = httpsResp.headers.get("strict-transport-security");
        if (hsts) {
          findings.push({
            severity: "excellent",
            category: "SSL/TLS",
            title: "HSTS Header Present",
            description:
              "HTTP Strict Transport Security (HSTS) is properly configured.",
            recommendation:
              "Ensure HSTS max-age is set appropriately for your security requirements.",
            businessImpact:
              "HSTS prevents SSL stripping attacks and ensures secure connections.",
          });
        }
      } else {
        findings.push({
          severity: "high",
          category: "SSL/TLS",
          title: "HTTPS Not Available",
          description: "The website is only available over HTTP, not HTTPS.",
          recommendation:
            "Implement SSL/TLS certificates and redirect HTTP to HTTPS.",
          businessImpact:
            "Lack of HTTPS exposes user data to interception and undermines trust.",
        });
      }
    } catch {
      findings.push({
        severity: "high",
        category: "SSL/TLS",
        title: "HTTPS Not Available",
        description: "The website is only available over HTTP, not HTTPS.",
        recommendation:
          "Implement SSL/TLS certificates and redirect HTTP to HTTPS.",
        businessImpact:
          "Lack of HTTPS exposes user data to interception and undermines trust.",
      });
    }
  }

  try {
    const response = await fetchWithTimeout(url, { method: "HEAD" });
    if (!response.ok) {
      findings.push({
        severity: "warning",
        category: "Connectivity",
        title: "TLS Handshake Issues",
        description:
          "TLS handshake could not be completed (protocol/cipher mismatch or network interception).",
        recommendation:
          "Allow TLS 1.2/1.3, disable legacy protocols, and verify cipher suites.",
        businessImpact:
          "Compatibility issues reduce security posture and can block secure access.",
      });
    }
  } catch (error: unknown) {
    const raw = String(error ?? "unknown error");
    findings.push({
      severity: "critical",
      category: "Connectivity",
      title: "Website Unreachable",
      description: `Unable to connect to ${url} over HTTPS. (${raw})`,
      recommendation:
        "Check website availability, DNS configuration, and TLS handshake.",
      businessImpact:
        "Website unavailability prevents security assessment and user access.",
      costEstimate: { currency: "USD", amount: 500, timeframe: "one-time" },
      technicalDetails: ctx.superAdminMode
        ? { remediationSteps: [raw] }
        : undefined,
    });
  }

  return { findings };
}

const sslFeature: ScanFeature = {
  id: "ssl",
  kind: "scan",
  version: "2.0.0",
  meta: { category: "SSL/TLS Security" },
  provides: ["security-surface"],
  run: runSslScan as any,
};

registerFeature(sslFeature);

export { sslFeature };
