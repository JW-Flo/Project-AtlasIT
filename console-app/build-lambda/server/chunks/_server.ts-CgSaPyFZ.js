import { g as getWorkerBase, a as getEnv, p as proxyFetch } from './_proxy-helpers-Bn_aZrFz.js';

const FALLBACK_TEMPLATES = [
  {
    key: "soc2.access_control",
    name: "SOC 2 Access Control Policy",
    format: "markdown"
  },
  {
    key: "iso27001.isms",
    name: "ISO 27001 Information Security Management Policy",
    format: "markdown"
  },
  {
    key: "nist.csf",
    name: "NIST Cybersecurity Framework Policy",
    format: "markdown"
  },
  {
    key: "hipaa.security",
    name: "HIPAA Security Rule Compliance Policy",
    format: "markdown"
  },
  {
    key: "dataprotection.general",
    name: "Data Protection & Privacy Policy",
    format: "markdown"
  }
];
function fallbackResponse() {
  return new Response(JSON.stringify({ templates: FALLBACK_TEMPLATES }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
const GET = async ({ platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const base = getWorkerBase(platform);
  const env = getEnv(platform);
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const upstream = `${base}/api/v1/policies/templates`;
    const res = await proxyFetch(platform, upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY,
        "x-tenant-id": tenantId
      }
    });
    if (!res.ok) {
      return fallbackResponse();
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return fallbackResponse();
  }
};

export { GET };
//# sourceMappingURL=_server.ts-CgSaPyFZ.js.map
