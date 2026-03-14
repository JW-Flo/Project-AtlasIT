import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = (platform?.env as any) || {};
  const complianceBase: string =
    env.COMPLIANCE_BASE ||
    "https://atlasit-compliance-worker.kd8jc7v8cd.workers.dev";

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const templateKey = body?.templateKey;
  if (!templateKey || typeof templateKey !== "string") {
    return new Response(JSON.stringify({ error: "templateKey required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = `${complianceBase.replace(/\/$/, "")}/api/v1/policies/generate`;
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.COMPLIANCE_API_KEY || "demo",
        "x-tenant-id": "demo",
      },
      body: JSON.stringify({
        templateKey,
        input: body.input || {},
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "Policy generation service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
};
