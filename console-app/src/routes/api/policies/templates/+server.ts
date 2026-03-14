import type { RequestHandler } from "@sveltejs/kit";
import { getWorkerBase, getEnv, proxyFetch } from "../../_proxy-helpers";

const FALLBACK_TEMPLATES = [
  {
    key: "soc2.demo",
    name: "SOC 2 Access Control Policy (Demo)",
    format: "markdown",
  },
  {
    key: "iso27001.isms",
    name: "ISO 27001 Information Security Management Policy",
    format: "markdown",
  },
  {
    key: "nist.csf",
    name: "NIST Cybersecurity Framework Policy",
    format: "markdown",
  },
  {
    key: "hipaa.security",
    name: "HIPAA Security Rule Compliance Policy",
    format: "markdown",
  },
  {
    key: "dataprotection.general",
    name: "Data Protection & Privacy Policy",
    format: "markdown",
  },
];

function fallbackResponse() {
  return new Response(JSON.stringify({ templates: FALLBACK_TEMPLATES }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: RequestHandler = async ({ platform }) => {
  const base = getWorkerBase(platform);
  const env = getEnv(platform);

  try {
    const upstream = `${base}/api/v1/policies/templates`;
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY || "demo",
        "x-tenant-id": env.TENANT_ID || "atlasit-prod",
      },
    });
    if (!res.ok) {
      return fallbackResponse();
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return fallbackResponse();
  }
};
