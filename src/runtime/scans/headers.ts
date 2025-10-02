import { registerFeature } from "../features/registry";
import type { ScanFeature } from "../features/types";
import type { EnhancedFinding, ScanContext, ScanRunOutput } from "./types";

async function runHeadersScan(
  url: string,
  ctx: ScanContext,
): Promise<ScanRunOutput> {
  const findings: EnhancedFinding[] = [];

  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Enhanced-Security-Scanner/2.0 (Business-Grade)",
      },
    });

    let effectiveResponse = response;
    if ([405, 403, 400].includes(response.status) || !response.ok) {
      try {
        const fallback = await fetch(url, {
          method: "GET",
          redirect: "manual",
          headers: {
            "User-Agent": "Enhanced-Security-Scanner/2.0 (Business-Grade)",
          },
        });
        if (fallback.ok) {
          effectiveResponse = fallback;
        }
      } catch {
        // ignore fallback errors
      }
    }

    const elapsed = Date.now() - start;
    const headers = new Map<string, string>();
    effectiveResponse.headers.forEach((value, name) => {
      headers.set(name.toLowerCase(), value as string);
    });

    const enhancedSecurityHeaders = [
      {
        name: "Strict-Transport-Security",
        severity: "high" as const,
        description:
          "HSTS header missing - visitors vulnerable to man-in-the-middle attacks",
        businessImpact:
          "Customer data and trust at risk, potential legal liability",
        recommendation:
          "Implement HSTS with 1+ year max-age and includeSubDomains",
        costEstimate: { currency: "USD", amount: 0, timeframe: "one-time" },
      },
      {
        name: "Content-Security-Policy",
        severity: "critical" as const,
        description:
          "CSP header missing - website vulnerable to malicious code injection and data theft",
        businessImpact:
          "Severe: Customer data theft, brand damage, potential lawsuits",
        recommendation:
          "Implement comprehensive CSP policy to prevent code injection attacks",
        costEstimate: { currency: "USD", amount: 1000, timeframe: "one-time" },
      },
      {
        name: "X-Frame-Options",
        severity: "medium" as const,
        description:
          "X-Frame-Options missing - site can be embedded in malicious frames for phishing",
        businessImpact:
          "Brand impersonation, customer phishing, reputation damage",
        recommendation: "Add X-Frame-Options: DENY or SAMEORIGIN header",
        costEstimate: { currency: "USD", amount: 0, timeframe: "one-time" },
      },
      {
        name: "X-Content-Type-Options",
        severity: "low" as const,
        description: "Missing protection against MIME type confusion attacks",
        businessImpact: "Low risk of malicious file execution",
        recommendation: "Add X-Content-Type-Options: nosniff header",
        costEstimate: { currency: "USD", amount: 0, timeframe: "one-time" },
      },
      {
        name: "Referrer-Policy",
        severity: "low" as const,
        description:
          "Referrer information may leak sensitive URLs to third parties",
        businessImpact: "Privacy concerns, potential exposure of internal URLs",
        recommendation: "Implement strict-origin-when-cross-origin policy",
        costEstimate: { currency: "USD", amount: 0, timeframe: "one-time" },
      },
    ];

    for (const header of enhancedSecurityHeaders) {
      if (!headers.has(header.name.toLowerCase())) {
        findings.push({
          severity: header.severity,
          category: "Security Headers",
          title: `Missing ${header.name} Header`,
          description: header.description,
          businessImpact: header.businessImpact,
          recommendation: header.recommendation,
          costEstimate: header.costEstimate,
          technicalDetails: ctx.superAdminMode
            ? {
                remediationSteps: [
                  `Header: ${header.name}\nImplementation: Add to web server configuration`,
                ],
              }
            : undefined,
        });
      }
    }

    const goodHeaders: string[] = [];
    for (const header of enhancedSecurityHeaders) {
      if (headers.has(header.name.toLowerCase())) {
        goodHeaders.push(header.name);
      }
    }

    if (goodHeaders.length > 0) {
      findings.push({
        severity: "excellent",
        category: "Security Headers",
        title: "Security Headers Implemented",
        description: `Found ${goodHeaders.length} security headers: ${goodHeaders.join(", ")}`,
        businessImpact: "Enhanced customer trust and security posture",
        recommendation:
          "Continue monitoring and maintain current security headers",
        costEstimate: { currency: "USD", amount: 0, timeframe: "annual" },
      });
    }

    findings.push({
      severity: elapsed > 3000 ? "medium" : "info",
      category: "Performance Security",
      title: "Header Fetch Time",
      description: `Initial header retrieval took ${elapsed}ms`,
      recommendation:
        "Optimize server responsiveness and leverage CDN caching where applicable.",
    });

    const hstsHeader = headers.get("strict-transport-security");
    if (hstsHeader) {
      const maxAgeRegex = /max-age=(\d+)/i;
      const maxAge = maxAgeRegex.exec(hstsHeader);
      if (maxAge && parseInt(maxAge[1], 10) < 31536000) {
        findings.push({
          severity: "medium",
          category: "Security Headers",
          title: "HSTS Configuration Needs Improvement",
          description: `HSTS max-age is ${Math.round(parseInt(maxAge[1], 10) / 86400)} days (recommended: 365+ days)`,
          businessImpact: "Reduced protection against SSL stripping attacks",
          recommendation:
            "Increase HSTS max-age to at least 1 year (31536000 seconds)",
          costEstimate: { currency: "USD", amount: 0, timeframe: "one-time" },
        });
      }
    }

    const serverHeader = headers.get("server");
    if (serverHeader) {
      findings.push({
        severity: "info",
        category: "Information Disclosure",
        title: "Server Information Disclosed",
        description: `Server header reveals: ${serverHeader}`,
        recommendation:
          "Consider removing or obscuring server information in production.",
        businessImpact:
          "Server information can help attackers identify potential vulnerabilities.",
      });
    }
  } catch {
    findings.push({
      severity: "warning",
      category: "Security Headers",
      title: "Unable to Analyze Headers",
      description: "Could not retrieve HTTP headers for analysis",
      businessImpact: "Cannot assess security posture of website headers",
      recommendation: "Verify website accessibility and try again",
      costEstimate: { currency: "USD", amount: 0, timeframe: "one-time" },
    });
  }

  return { findings };
}

const headersFeature: ScanFeature = {
  id: "headers",
  kind: "scan",
  version: "2.0.0",
  meta: { category: "Security Headers" },
  provides: ["security-surface"],
  run: runHeadersScan as any,
};

registerFeature(headersFeature);

export { headersFeature };
