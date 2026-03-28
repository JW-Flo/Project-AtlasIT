import type { RequestHandler } from "@sveltejs/kit";

/** GET — proxy single DLQ entry from orchestrator */
export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, 403);

  const env = (platform?.env as any) || {};
  const orchestratorUrl =
    env.ORCHESTRATOR_URL ?? "https://orchestrator.atlasit.pro";

  const upstream = `${orchestratorUrl}/api/v1/dead-letter/${encodeURIComponent(params.id!)}`;

  try {
    const res = await fetch(upstream, {
      headers: {
        "X-Tenant-ID": tenantId,
        ...(env.ORCHESTRATOR_API_KEY
          ? { "x-api-key": env.ORCHESTRATOR_API_KEY }
          : {}),
      },
    });
    const data = await res.json();
    return json(data, res.status);
  } catch {
    return json({ error: "Dead letter service unavailable" }, 503);
  }
};

/** POST — replay a DLQ entry */
export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, 403);

  const env = (platform?.env as any) || {};
  const orchestratorUrl =
    env.ORCHESTRATOR_URL ?? "https://orchestrator.atlasit.pro";

  const upstream = `${orchestratorUrl}/api/v1/dead-letter/${encodeURIComponent(params.id!)}/replay`;

  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        ...(env.ORCHESTRATOR_API_KEY
          ? { "x-api-key": env.ORCHESTRATOR_API_KEY }
          : {}),
      },
    });
    const data = await res.json();
    return json(data, res.status);
  } catch {
    return json({ error: "Dead letter replay service unavailable" }, 503);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
