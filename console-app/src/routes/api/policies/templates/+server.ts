import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ platform }) => {
  const env = (platform?.env as any) || {};
  const complianceBase: string =
    env.COMPLIANCE_BASE ||
    "https://atlasit-compliance-worker.kd8jc7v8cd.workers.dev";

  try {
    const upstream = `${complianceBase.replace(/\/$/, "")}/api/v1/policies/templates`;
    const res = await fetch(upstream, {
      headers: {
        "x-api-key": env.COMPLIANCE_API_KEY || "demo",
        "x-tenant-id": "demo",
      },
    });
    if (!res.ok) {
      // Fall back to built-in templates if compliance worker is unreachable
      return new Response(
        JSON.stringify({
          templates: [
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
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Fallback: return built-in template list
    return new Response(
      JSON.stringify({
        templates: [
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
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
};
